import {
    indexBy,
    identity,
    map,
    pipe,
    prop,
    toUpper,
    concat,
    uniq,
    pluck,
    sort
} from 'ramda';

interface ICrudOptions {
    fetch?: boolean;
    update?: boolean;
    create?: boolean;
    delete?: boolean;
}

interface ICrudActions {
    fetchStart?: <T>(data?: T) => ({ type: string; data?: T; });
    fetchSuccess?: <R, T>(payload: R, data?: T) => ({ type: string; payload: R; data?: T; });
    fetchError?: <Error, T>(error: Error, data?: T) => ({ type: string; error: Error; data?: T; });
}

export interface ICrudAction {
    type: string;
    error?: Error;
    payload?: any;
    data?: any;
}

const defaultOptions: ICrudOptions = {
    fetch: false,
    update: false,
    create: false,
    delete: false
};

const fetchTypes = ['FETCH_START', 'FETCH_SUCCESS', 'FETCH_ERROR'];
const updateTypes = ['UPDATE_START', 'UPDATE_SUCCESS', 'UPDATE_ERROR'];
const createTypes = ['CREATE_START', 'CREATE_SUCCESS', 'CREATE_ERROR'];
const deleteTypes = ['DELETE_START', 'DELETE_SUCCESS', 'DELETE_ERROR'];

const updateArray = (items, array: any[] = []) => pipe(
    concat(pluck('id', items)),
    uniq,
    sort((a: number, b: number) => a - b)
)(array);

const generator = (type: string) => {
    const TYPE = toUpper(type);

    return pipe(
        map((i) => `${TYPE}_${i}`),
        indexBy(identity)
    );
};

const typesGenerator = (type: string, options: ICrudOptions) => {
    const typeGen = generator(type);

    return {
        ...(options.fetch ? typeGen(fetchTypes) : {}),
        ...(options.update ? typeGen(updateTypes) : {}),
        ...(options.create ? typeGen(createTypes) : {}),
        ...(options.delete ? typeGen(deleteTypes) : {})
    };
};

const generateFetchActions = (type: string): ICrudActions => {
    const TYPE = toUpper(type);

    return {
        fetchStart: (data?: any) => ({
            type: `${TYPE}_FETCH_START`,
            data
        }),
        fetchSuccess: (payload: any, data?: any) => ({
            type: `${TYPE}_FETCH_SUCCESS`,
            payload,
            data
        }),
        fetchError: (error: Error, data?: any) => ({
            type: `${TYPE}_FETCH_ERROR`,
            error,
            data
        })
    };
};

// TODO: Add create, update and delete generators

const generateFetchHandlers = (type: string) => {
    const TYPE = toUpper(type);

    return {
        [`${TYPE}_FETCH_START`]: (state) => ({
            ...state,
            isFetching: true
        }),
        [`${TYPE}_FETCH_SUCCESS`]: (state, action: ICrudAction) => ({
            ...state,
            isFetching: false,
            [type]: updateArray(action.payload, state[type]),
            [`${type}ById`]: {
                ...state[`${type}ById`],
                ...indexBy(prop('id'), action.payload)
            }
        }),
        [`${TYPE}_FETCH_ERROR`]: (state, action: ICrudAction) => ({
            ...state,
            isFetching: false,
            error: action.error
        })
    };
};

const generateReducer = (type: string, options) => {
    const initialState = {
        isFetching: false,
        [type]: [],
        [`${type}ById`]: {}
    };

    const actionHandlers = {
        ...(options.fetch ? generateFetchHandlers(type) : {})
    };

    return (state: any = initialState, action: ICrudAction) => {
        if (actionHandlers[action.type]) {
            return actionHandlers[action.type](state, action);
        }

        return state;
    };
};

export const crudGenerator = (type: string, opts: ICrudOptions = {}) => {
    const options = {
        ...defaultOptions,
        ...opts
    };
    const types = typesGenerator(type, options);
    const actions: ICrudActions = {
        ...(options.fetch ? generateFetchActions(type) : {})
    };
    const reducer = generateReducer(type, options);

    return {
        types,
        actions,
        reducer
    };
};
