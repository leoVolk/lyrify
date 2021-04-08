<template>
  <div class="container-fluid h-100">
    <div class="row h-100">
      <div class="col-2 sidebar d-none d-sm-flex border-end">
        <side-bar
          v-on:logout="logOut"
          :me="user"
          :refreshToken="refreshToken"
          :authUrl="authUrl"
        ></side-bar>
      </div>
      <div class="col-sm-10 col-12 h-100">
        <div v-show="currentSong" v-if="currentSong" class="row h-100">
          <div class="col-12 h-100">
            <song-bar :currentSong="currentSong"></song-bar>
            <div class="row h-75 align-self-start overflow-auto">
              <div class="col-12">
                <lyrics :lyrics="lyrics" :currentSong="currentSong"></lyrics>
              </div>
            </div>
          </div>

          <div v-if="!currentSong && refreshToken.length > 0" class="col-12">
            Seems like you are not playing any song. :(
          </div>
        </div>
      </div>
    </div>

    <info-button></info-button>
  </div>
</template>

<script>
  require('dotenv').config();

  import axios from 'axios';
  import Lyrics from './Home/Lyrics.vue';
  import SongBar from './Home/SongBar.vue';
  import InfoButton from './Home/InfoButton.vue';
  import SideBar from './Home/SideBar.vue';
  var SpotifyWebApi = require('spotify-web-api-node');

  var scopes = [
      'user-read-private',
      'user-read-email',
      'user-read-currently-playing'
    ],
    redirectUri = 'http://localhost:9080',
    clientId = process.env.SPOTIFY_CLIENT_URL,
    clientSecret = process.env.SPOTIFY_CLIENT_SECRET,
    state = 'kgyg9bu4';

  var spotifyApi = new SpotifyWebApi({
    redirectUri: redirectUri,
    clientId: clientId,
    clientSecret: clientSecret
  });

  export default {
    name: 'landing-page',
    components: { Lyrics, SongBar, InfoButton, SideBar },
    data() {
      return {
        isLoading: false,
        title: '',
        lyrics: '',
        authUrl: '',
        refreshToken: '',
        currentSong: null,
        user: null
      };
    },
    created() {
      this.createAuthURL();
    },
    mounted() {
      this.init();
    },
    methods: {
      createAuthURL() {
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
        const params = new URLSearchParams(window.location.search);
        //this is bullshit, optimize
        if (
          params.get('code') &&
          !window.localStorage.getItem('refreshToken')
        ) {
          spotifyApi.authorizationCodeGrant(params.get('code')).then(
            data => {
              // Set the access token on the API object to use it in later calls
              spotifyApi.setAccessToken(data.body['access_token']);
              spotifyApi.setRefreshToken(data.body['refresh_token']);
              window.localStorage.setItem(
                'refreshToken',
                data.body['refresh_token']
              );
              this.refreshToken = data.body['refresh_token'];
              this.getCurrentPlayingSong();
              this.getMe();
            },
            function(err) {
              console.error('Something went wrong!', err);
            }
          );
        } else if (window.localStorage.getItem('refreshToken')) {
          this.refreshToken = window.localStorage.getItem('refreshToken');
          await spotifyApi.setRefreshToken(this.refreshToken);
          await this.refreshAccessToken();
          this.getCurrentPlayingSong();
          this.getMe();
        }
      },
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
      },
      getMe() {
        this.refreshAccessToken().then(() => {
          spotifyApi.getMe().then(
            data => {
              this.user = data.body;
            },
            function(err) {
              console.log('Something went wrong!', err);
            }
          );
        });
      },
      logOut() {
        this.refreshToken = '';
        this.user = null;
        this.currentSong = null;
        this.lyrics = '';
        this.title = '';

        window.localStorage.clear();
      }
    }
  };
</script>
<style lang="scss" src="../assets/style.scss"></style>
