import * as React from 'react';
const s = require('./style.css');

class About extends React.Component<any, any> {
    public render(): JSX.Element {
        return (
            <div className={ s.about }>
                <h4>About</h4>
            </div>
        );
    }
}

export { About }