import Router from 'vue-router';
import Vue from 'vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: require('@/components/Home').default
    },
    {
      path: '*',
      redirect: '/'
    },
    {
      path: '/me',
      name: 'me',
      component: require('@/components/Me').default
    }
  ]
});
