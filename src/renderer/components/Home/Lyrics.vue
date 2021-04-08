<template>
  <div class="row justify-content-center content user-select-all">
    <div class="col-8 text-center">
      <p v-if="lyrics.length > 0" style="white-space: pre-line; ">
        {{ lyrics }}
      </p>
      <p v-else>
        Sorry, we could not find any lyrics for "{{ currentSong.item.name }}" by
        {{ currentSong.item.artists[0].name }}
      </p>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      lyrics: '',
      currentSong: null
    }
  };
</script>
<style lang="scss"></style>
