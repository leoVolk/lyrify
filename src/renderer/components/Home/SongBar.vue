<template>
  <div class="row justify-content-center">
    <div class="col-12 text-center py-3 border-bottom">
      <div class="row justify-content-center ">
        <div class="col-auto ">
          <h4>
            <span v-for="artist in currentSong.item.artists" :key="artist.id">
              {{ artist.name }}</span
            >
          </h4>
          <h1>{{ currentSong.item.name }}</h1>
          <span>{{ currentSong.item.album.name }}</span>
        </div>
      </div>
    </div>
    <div class="album-background">
      <img
        id="album-cover"
        class="img-cover"
        :src="currentSong.item.album.images[0].url"
      />
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      currentSong: null
    }
  };
</script>
