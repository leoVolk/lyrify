<template>
  <div class="container-fluid position-relative overflow-auto">
    <div
      class="row justify-content-center position-sticky song-title shadow-lg"
    >
      <div class="col-8 py-3 text-center">
        <h3>To Hell And Back</h3>
        <hr style="height: 2px" />
        <h4>Sabaton</h4>
      </div>
    </div>
    <div class="row my-lg-5 justify-content-center ">
      <div class="col-8 text-center">
        <p style="white-space: pre-line">
          {{ lyrics }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from 'axios';

  export default {
    name: 'landing-page',
    components: {},
    methods: {},
    data() {
      return {
        title: '',
        interpret: '',
        lyrics: ''
      };
    },
    mounted() {
      axios
        .get('https://api.lyrics.ovh/v1/Sabaton/To%20hell%20and%20back')
        .then(res => {
          console.log(res);
          this.lyrics = res.data.lyrics;
        });
    }
  };
</script>

<style lang="scss">
  @import url('https://fonts.googleapis.com/css?family=Roboto+Mono');
  body {
    background-color: rgb(22, 22, 22);
    color: rgb(196, 196, 196);
    font-family: 'Roboto Mono', sans-serif;
    -webkit-app-region: drag;
  }

  .song-title {
    background-color: rgb(22, 22, 22);
    color: rgb(196, 196, 196);

    top: 0px;
  }
</style>
