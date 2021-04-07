<template>
  <div class="container-fluid h-100 position-relative">
    <div class="row">
      <div
        v-if="refreshToken.length === 0"
        class="row justify-content-center py-3"
      >
        <div class="col-auto text-center">
          <a :href="authUrl" class="btn rounded-pill btn-success">
            Login With Spotify
          </a>
        </div>
      </div>
      <div v-else-if="currentSong" class="shadow-lg position-sticky song-title">
        <song-bar :currentSong="currentSong"></song-bar>
      </div>
      <div v-if="currentSong" class="row my-2 justify-content-center ">
        <lyrics :currentSong="currentSong" :lyrics="lyrics"></lyrics>
      </div>
    </div>
    <info-button></info-button>
  </div>
</template>

<script>
  import axios from 'axios';
  import Lyrics from './Home/Lyrics.vue';
  import SongBar from './Home/SongBar.vue';
  import InfoButton from './Home/InfoButton.vue';
  require('dotenv').config();
  var SpotifyWebApi = require('spotify-web-api-node');
  var spotifyApi;
  export default {
    name: 'landing-page',
    components: { Lyrics, SongBar, InfoButton },
    methods: {
      createAuthURL() {
        var scopes = [
            'user-read-private',
            'user-read-email',
            'user-read-currently-playing'
          ],
          redirectUri = 'http://localhost:9080',
          clientId = process.env.SPOTIFY_CLIENT_URL,
          clientSecret = process.env.SPOTIFY_CLIENT_SECRET,
          state = 'kgyg9bu4';

        spotifyApi = new SpotifyWebApi({
          redirectUri: redirectUri,
          clientId: clientId,
          clientSecret: clientSecret
        });

        this.authUrl = spotifyApi.createAuthorizeURL(scopes, state);
      },
      async refreshAccessToken() {
        await spotifyApi.refreshAccessToken().then(
          data => {
            // Save the access token so that it's used in future calls
            spotifyApi.setAccessToken(data.body['access_token']);
          },
          function(err) {
            console.log('Could not refresh access token', err);
          }
        );
      },
      async init() {
        this.createAuthURL();
        const params = new URLSearchParams(window.location.search);

        if (
          params.get('code') &&
          !window.localStorage.getItem('refreshToken')
        ) {
          this.isLoading = true;
          spotifyApi.authorizationCodeGrant(params.get('code')).then(
            data => {
              this.isLoading = false;
              // Set the access token on the API object to use it in later calls
              spotifyApi.setAccessToken(data.body['access_token']);
              spotifyApi.setRefreshToken(data.body['refresh_token']);
              window.localStorage.setItem(
                'refreshToken',
                data.body['refresh_token']
              );
              this.refreshToken = window.localStorage.getItem('refreshToken');
              window.history.replaceState(null, null, window.location.pathname);
              this.getCurrentPlayingSong();
            },
            function(err) {
              console.log('Something went wrong!', err);
            }
          );
        } else if (window.localStorage.getItem('refreshToken')) {
          this.refreshToken = window.localStorage.getItem('refreshToken');
          await spotifyApi.setRefreshToken(this.refreshToken);
          await this.refreshAccessToken();
          this.getCurrentPlayingSong();
        }
      },
      getSomethingFromSpotifyApi() {},
      getCurrentPlayingSong() {
        this.refreshAccessToken().then(() => {
          spotifyApi.getMyCurrentPlayingTrack().then(
            data => {
              this.title = data.body.item.name;
              this.currentSong = data.body;
              this.getLyrics();
            },
            function(err) {
              console.error(err);
            }
          );
        });
        setInterval(() => {
          if (!this.refreshToken) return;
          this.refreshAccessToken().then(() => {
            spotifyApi.getMyCurrentPlayingTrack().then(
              data => {
                //check if title doesnt equal current track so we know it's a new song
                if (data.body.item.name != this.title) {
                  this.title = data.body.item.name;
                  this.currentSong = data.body;

                  this.getLyrics();
                }
              },
              function(err) {
                console.error(err);
              }
            );
          });
        }, 1000);
      },
      getLyrics() {
        axios
          .get(
            'https://api.lyrics.ovh/v1/' +
              this.currentSong.item.artists[0].name +
              '/' +
              this.currentSong.item.name
          )
          .then(res => {
            this.lyrics = res.data.lyrics;
            this.isLoading = false;
          })
          .catch(err => {
            console.error(err);
            this.lyrics = '';
          });
      }
    },
    data() {
      return {
        isLoading: false,
        title: '',
        lyrics: '',
        authUrl: '',
        refreshToken: '',
        currentSong: null
      };
    },
    mounted() {
      this.init();
    }
  };
</script>
<style lang="scss" src="../assets/style.scss"></style>
