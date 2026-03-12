import { legacy_createStore as createStore } from 'redux';

// Define action types
const SET_ROLE = 'SET_ROLE';
const SET_USER_INFO = 'SET_USER_INFO';

// Action creators
export const setRole = (isadmin) => ({
  type: SET_ROLE,
  payload: isadmin,
});
export const setUserInfo = (userInfo) => ({
  type: SET_USER_INFO,
  payload: userInfo,
});


const initialState = {

   isadmin: true,
  userInfo: {
    user:'',
    isadmin: true,
  },
};

const changeState = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER_INFO:
      window.localStorage.setItem("userInfo", JSON.stringify(action.payload));
      return { ...state, userInfo: action.payload };
    case SET_ROLE:
      window.localStorage.setItem("userRole", action.payload);
      return { ...state, isadmin: action.payload };
    case 'set':
      return { ...state, ...action };
    default:
      return state;
  }
};


const store = createStore(changeState);
export default store;










