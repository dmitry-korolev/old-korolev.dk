import * as authentication from 'feathers-authentication';

import { headlinesService, headlinesServiceName } from 'api/headlines';
import { optionsService, optionsServiceName } from 'api/options';
import { postsService, postsServiceName } from 'api/posts';
import { tagsService, tagsServiceName } from 'api/tags';
import { usersService, usersServiceName } from 'api/users';

const apiEndpoint = (serviceName: string): string => `/api/${serviceName}`;

export const setupApplication = (app: any): void => {
    app.configure(authentication({
        userEndpoint: `/api/${usersServiceName}`
    }));

    app.use(apiEndpoint(usersServiceName), usersService());
    app.use(apiEndpoint(postsServiceName), postsService());
    app.use(apiEndpoint(headlinesServiceName), headlinesService());
    app.use(apiEndpoint(tagsServiceName), tagsService());
    app.use(apiEndpoint(optionsServiceName), optionsService());
};
