import { IApplication } from 'models/appication';
import { ICategories, IPosts } from 'models/content';
import { IHeadlines } from 'models/headlines';
import { IUser } from 'models/user';
import { Store } from 'redux';

export interface IStore {
    headlines: IHeadlines;
    posts: IPosts;
    categories: ICategories;
    application: IApplication;
    user: IUser;
}

interface IRouteParams {
    postId?: number;
    categoryName?: string;
}

export interface IAsyncConnectArguments {
    store: Store<IStore>;
    params?: IRouteParams;
}

export interface IAsyncConnectOwnProps {
    params: IRouteParams;
}

export type IGetState = () => IStore;
