import { randomFromArray, crudGenerator } from 'utils';

// Models
import { IHeadlines } from 'models/headlines';
import { ICrudAction } from 'utils';

const {
    actions,
    reducer
} = crudGenerator('headlines', { fetch: true });
const SET_HEADLINE: string = 'headlines/SET_HEADLINE';

/** Initial State */
const initialState: IHeadlines = {
    isFetching: false,
    headlines: [],
    headlinesById: {},
    current: { content: 'На последнем издыхании я проклинаю нелетающих тварей, называющих себя пингвинами!' }
};

/** Reducer */
function headlinesReducer(state: IHeadlines = initialState, action: ICrudAction): IHeadlines {
    switch (action.type) {
        case SET_HEADLINE:
            return {
                ...state,
                current: state.headlinesById[randomFromArray(state.headlines)]
            };

        default:
            return reducer(state, action);
    }
}

/* Async action creator */
const getHeadlines = () => (dispatch, getState) => {
    if (getState().headlines.headlines.length) {
        return Promise.resolve();
    }

    dispatch(actions.fetchStart());

    return Promise.resolve(require('../../../../../mocks/taglines.json'))
        .then((headlines: string[]) => dispatch(actions.fetchSuccess(headlines)))
        .then(() => dispatch(headlinesSet()));
};

/* Action creators */
const headlinesSet = () => ({
    type: SET_HEADLINE
});

export {
    headlinesReducer,
    getHeadlines,
    headlinesSet
}