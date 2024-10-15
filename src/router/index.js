import DeleteAccount from "@/DeleteAccount.vue";
import { getAuth } from "firebase/auth";
import { createRouter, createWebHistory } from 'vue-router';
import accountDetails from '../accountDetails.vue';
import addaccountView from '../addaccount.vue';
import AdminPage from '../AdminPage.vue';
import App from '../App.vue';
import ChangePassword from '../ChangePassword.vue';
import FirstPage from '../FirstPage.vue';
import loginView from '../login.vue';
import ProductView from '../Product.vue';
import SecondPage from '../SecondPage.vue';
import signupadminView from '../signupadmin.vue';
import SprintView from '../Sprint.vue';
import TotalContributionPage from '../totalcontribution.vue';
import averagecontribution from "../averagecontribution.vue";

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/',
    name: 'Home',
    component: App,
  },
  {
    path: '/accountdetails',
    name: 'accountDetails',
    component: accountDetails
  },
  {
    path: '/product',
    name: 'ProductView',
    component: ProductView
  },
  {
    path: '/sprint',
    name: 'SprintView',
    component: SprintView,
  },
  { 
    path: '/page1/:name',
    name: 'FirstPage', 
    component: FirstPage 
  },
  { 
    path: '/page2/:name', 
    name: 'SecondPage', 
    component: SecondPage },
  {
    path: '/login', // Define the route for Option A
    name: 'loginView',
    component: loginView,
  },
  {
    path: '/signupadmin',
    name: 'signupadminView',
    component: signupadminView,
  },
  {
    path: '/addaccount',
    name: 'addaccountView',
    component: addaccountView,
  },

  {
    path: '/totalcontribution',
    name: 'TotalContributionPage',
    component: TotalContributionPage,
  },

  {
    path: '/averagecontribution',
    name: 'averagecontribution',
    component: averagecontribution,
  },

  {
    path: '/ChangePassword',
    name: 'ChangePassword',
    component: ChangePassword,
    meta: { requiresAuth: true },
  },
  {
    path: '/Admin',
    name: 'AdminPage',
    component: AdminPage
  },
  {
    path: '/DeleteUsers',
    name: 'DeleteUsers',
    component: DeleteAccount
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = getAuth();
  const user = auth.currentUser;
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !user) {
    next('/login'); // Redirect to login if not authenticated
  } else {
    next(); // Proceed if authenticated or no auth required
  }
});

export default router;
