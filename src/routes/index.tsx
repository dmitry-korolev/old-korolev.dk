import { About, App, Archive, Single } from 'containers';
import * as React from 'react';
import { IndexRoute, Redirect, Route } from 'react-router';

export default (
    <Route path='/' component={ App }>
        <IndexRoute component={ Archive } />
        <Redirect from='blog' to='/' />
        <Route path='blog/page/:page' component={ Archive } />
        <Route path='blog/:categoryName/page/:page' component={ Single } />
        <Route path='blog/:categoryName/:postId' component={ Single } />
        <Route path='about' component={ About } />
    </Route>
);