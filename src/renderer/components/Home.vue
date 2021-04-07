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
        <div class="row justify-content-center">
          <div class="col-12 text-center py-3 border-bottom">
            <div class="row justify-content-center ">
              <div class="col-auto ">
                <h4>
                  <span
                    v-for="artist in currentSong.item.artists"
                    :key="artist.id"
                  >
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
      </div>
      <div v-if="currentSong" class="row my-2 justify-content-center ">
        <div class="col-8 text-center">
          <p v-if="lyrics.length > 0" style="white-space: pre-line">
            {{ lyrics }}
          </p>
          <p v-else>
            Sorry, we could not find any lyrics for "{{
              currentSong.item.name
            }}" by {{ currentSong.item.artists[0].name }}
          </p>
        </div>
      </div>
    </div>
    <div class="infoBtn h-100 w-100">
      <div class="row justify-content-end">
        <div class="col-auto ">
          <button class="btn rounded-circle shadow">?</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from 'axios';
  require('dotenv').config();
  const customTitlebar = require('custom-electron-titlebar');
  var SpotifyWebApi = require('spotify-web-api-node');
  var spotifyApi;
  export default {
    name: 'landing-page',
    components: {},
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

        if (params.get('code') && !localStorage.getItem('refreshToken')) {
          this.isLoading = true;
          spotifyApi.authorizationCodeGrant(params.get('code')).then(
            data => {
              this.isLoading = false;
              // Set the access token on the API object to use it in later calls
              spotifyApi.setAccessToken(data.body['access_token']);
              spotifyApi.setRefreshToken(data.body['refresh_token']);
              localStorage.setItem('refreshToken', data.body['refresh_token']);
              this.refreshToken = localStorage.getItem('refreshToken');
              window.history.replaceState(null, null, window.location.pathname);
              this.getCurrentPlayingSong();
            },
            function(err) {
              console.log('Something went wrong!', err);
            }
          );
        } else if (localStorage.getItem('refreshToken')) {
          this.refreshToken = localStorage.getItem('refreshToken');
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

      new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#161616')
      });
    }
  };
</script>
<style lang="scss" src="../assets/style.scss"></style>
