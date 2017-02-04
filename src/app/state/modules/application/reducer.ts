import { IApplication } from 'models/appication';

const initialState: IApplication = {
    title: 'Пингвин Рыба Есть',
    titleTemplate: '%s | Пингвин Рыба Есть',
    head: {
        meta: [
            { charset: 'utf-8' },
            { 'http-equiv': 'x-ua-compatible', 'content': 'ie=edge' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { name: 'description', content: 'Пингвин Рыба Есть' }
        ],
        link: [
            {
                rel: 'canonical',
                href: 'https://korolev.dk/'
            },
            {
                type: 'text/css',
                href: '//fonts.googleapis.com/css?family=Comfortaa:700&subset=latin,cyrillic',
                rel: 'stylesheet'
            },
            {
                type: 'text/css',
                href: '//fonts.googleapis.com/css?family=Open+Sans:400italic,400,700&subset=cyrillic-ext,latin-ext',
                rel: 'stylesheet'
            }
        ]
    }
};

// Add grid in dev mode
if (process.env.NODE_ENV !== 'production') {
    initialState.head.link.push({
        type: 'text/css',
        href: 'https://s3-eu-west-1.amazonaws.com/graaf/bbc.css?v=0.2.0',
        rel: 'stylesheet'
    });
}

export const applicationReducer = (state = initialState) => {
    return state;
};
