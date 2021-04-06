const state = {
  expiresIn: 0,
  accessToken: '',
  refreshToke: ''
};

const mutations = {
  SET_ACCESS_TOKEN(state, token) {
    state.accessToken = token;
  },
  SET_REFRESH_TOKEN(state, token) {
    state.refreshToke = token;
  },
  SET_EXPIRES_IN(state, expiresIn) {
    state.expiresIn = expiresIn;
  }
};

const actions = {
  setAccessToken({ commit }, token) {
    // do something async
    commit('SET_ACCESS_TOKEN', token);
  },
  setRefreshToke({ commit }, token) {
    // do something async
    commit('SET_REFRESH_TOKEN', token);
  }
};

export default {
  state,
  mutations,
  actions
};
