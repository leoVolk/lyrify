<template>
  <div class="w-100">
    <div class="w-100 pt-5" v-if="me">
      <div class="row justify-content-center">
        <div class="col-8 col-lg-5">
          <img
            class="img-fluid rounded-circle"
            :src="me.images[0].url"
            alt=""
          />
        </div>
        <div class="col-12 text-center pt-3">{{ me.display_name }}</div>
        <div class="col-12 pt-3">
          <div
            @click="$emit('logout', $event)"
            class="btn btn-primary rounded-pill w-100"
          >
            Log Out
          </div>
        </div>
      </div>
    </div>
    <div v-else class="w-100 pt-5">
      <div class="row justify-content-center">
        <div class="col-12 ">
          <p class="bg-dark p-3 rounded-2">
            Please log in with your Spotify account
          </p>
        </div>
        <div class="col-12 pt-3">
          <a
            :href="authUrl"
            target="blank"
            class="btn rounded-pill btn-primary w-100"
          >
            Log In
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      me: null,
      authUrl: '',
      refreshToken: ''
    }
  };
</script>
