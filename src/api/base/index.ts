import * as debug from 'debug';
import { Service } from 'feathers-nedb';
import * as NeDB from 'nedb';

import {
    assocPath,
    lens,
    path,
    set,
    view
} from 'ramda';

// Models
import { IJSONData, IReturnData } from 'models/api';
import IDebugger = debug.IDebugger;

type IMapCache<T> = Map<string, T>;
interface ICachedQueries {
    find: IMapCache<IReturnData<IJSONData[]>>;
    get: IMapCache<IReturnData<IJSONData>>;
}

interface ICreateServiceOptions {
    serviceName: string;
    incremental?: boolean;
    cacheable?: boolean;
    Model: any;
    pagination?: any;
}

const optionLastId = 'last_id';
const sortL = lens(path(['query', '$sort']), assocPath(['query', '$sort']));

export class BaseService extends Service {
    private logInfo: IDebugger;
    private logError: IDebugger;
    private serviceName: string;
    private incremental: boolean;
    private cacheable: boolean;
    private cachedQueries: ICachedQueries;
    private isCreationInProcess: boolean;
    private creationQueue: Map<string, any>;
    private optionsService: any;

    constructor({
        serviceName,
        incremental = false,
        cacheable = true,
        Model
    }: ICreateServiceOptions) {
        super({ Model });

        this.serviceName = serviceName;
        this.incremental = incremental;
        this.cacheable = cacheable;
        this.isCreationInProcess = false;
        this.cachedQueries = {
            find: new Map(),
            get: new Map()
        };
        this.creationQueue = new Map();

        this.logInfo = debug(`k:db:${serviceName}:info`);
        this.logError = debug(`k:db:${serviceName}:error`);

        if (this.incremental) {
            Model.ensureIndex({
                fieldName: 'id',
                unique: true,
                sparse: true
            });
        }

        this.clearCache = this.clearCache.bind(this);
    }

    private async formatData(promise: Promise<any>): Promise<IReturnData<any>> {
        let error = null;
        const result = await promise.catch((e: Error): void => {
            this.logError(e);
            error = e;
        });

        if (error) {
            return {
                resultCode: 'Error',
                errorMessage: error.message
            };
        }

        return {
            resultCode: 'OK',
            payload: result
        };
    }

    private clearCache(data?: any): any {
        const methods = ['find', 'get'];

        methods.forEach((method: string): void => {
            this.cachedQueries[method].clear();
        });

        return data;
    }

    public async find(params?: any): Promise<IReturnData<IJSONData[]>> {
        if (this.incremental && !view(sortL, params)) {
            params = set(sortL, {
                id: -1
            }, params);
        }

        const key = JSON.stringify(params);

        if (this.cacheable && this.cachedQueries.find.has(key)) {
            this.logInfo('Found cached FIND query', params);
            return this.cachedQueries.find.get(key);
        }

        this.logInfo('FIND', params);

        const result = await this.formatData(super.find(params));

        if (this.cacheable && result.resultCode === 'OK') {
            this.cachedQueries.find.set(key, result);
        }

        return result;
    }

    public async get(id: any, params: any): Promise<IReturnData<IJSONData>> {
        const key = JSON.stringify([id, params]);

        if (this.cacheable && this.cachedQueries.get.has(key)) {
            this.logInfo('Found cached GET query', id, params);
            return this.cachedQueries.get.get(key);
        }

        this.logInfo('GET', id, params);

        const result = await this.formatData(super.get(id, params));

        if (this.cacheable && result.resultCode === 'OK') {
            this.cachedQueries.get.set(key, result);
        }

        return result;
    }

    private async createNormal(data: any, params: any): Promise<IJSONData> {
        const result = await super.create(data, params);
        await this.clearCache();
        this.isCreationInProcess = false;

        if (this.creationQueue.size) {
            // Getting the first element in queue (FIFO)
            const [[key, value]] = this.creationQueue.entries();
            this.creationQueue.delete(key);

            value.resolve(await this.create(value.data, value.params));
        }

        return result;
    }

    private async createIncremental(data: any, params: any): Promise<IJSONData> {
        const serviceLastId = await this.optionsService.get(optionLastId);
        let newId = 0;

        if (serviceLastId.resultCode === 'OK') {
            newId = serviceLastId.payload.value + 1;
        }

        await newId > 0
            ? this.optionsService.update(optionLastId, { value: newId, internal: true })
            : this.optionsService.create({ _id: optionLastId, value: newId, internal: true });

        data._id = String(newId);

        this.logInfo('POST', data, params);

        return this.createNormal(data, params);
    }

    public async create(data: any, params: any): Promise<IReturnData<IJSONData>> {
        data.created = new Date();

        if (this.isCreationInProcess) {
            this.logInfo('Found active CREATE request, moving request to queue');
            return new Promise<IReturnData<IJSONData>>((resolve: Function): void => {
                this.creationQueue.set(JSON.stringify([data, params]), {
                    data,
                    params,
                    resolve
                });
            });
        }

        this.isCreationInProcess = true;

        return this.formatData(
            this.incremental
                ? this.createIncremental(data, params)
                : this.createNormal(data, params)
        );
    }

    public async update(id: number, data: any, params: any): Promise<IReturnData<IJSONData>> {
        data.updated = new Date();
        this.logInfo('PUT', id, data, params);

        const result = await this.formatData(super.update(id, data, params));
        await this.clearCache();

        return result;
    }

    public async patch(id: any, data: any, params: any): Promise<IReturnData<IJSONData>> {
        this.logInfo('PATCH', id, data, params);

        const result = await this.formatData(super.patch(id, data, params));
        await this.clearCache();

        return result;
    }

    public async remove(id: any, params: any): Promise<IReturnData<IJSONData>> {
        this.logInfo('DELETE', id, params);

        const result = await this.formatData(super.remove(id, params));
        await this.clearCache();

        return result;
    }

    public setup(app: any): void {
        this.optionsService = app.service('/api/options');
    }
}

export const baseService = (name: string): any => {
    const db = new NeDB({
        filename: `db/${process.env.NODE_ENV === 'production' ? 'prod' : 'dev'}/${name}`,
        autoload: true
    });

    return new BaseService({
        serviceName: name,
        incremental: true,
        Model: db
    });
};
