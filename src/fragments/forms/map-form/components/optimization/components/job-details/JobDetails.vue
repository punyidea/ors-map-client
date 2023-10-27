<template>
  <box background="white" no-shadow>
    <div slot="header">
      <share :url="shareUrl"></share>
      <print :map-view-data="mapViewData"></print>
      <h3>{{$t('jobDetails.jobDetails')}}</h3>
    </div>
    <div>
      <template v-if="$highResolution">
        <v-img :src="imagePath" :lazy-src="imageUrlFallBack" :title="job.jobName + ' - ' + $t('jobDetails.satelliteView') "  style="width:100%;max-height:250px"></v-img>
        <br>
      </template>
      <div>
        <div v-if="job.jobName">{{$t('jobDetails.jobName')}}: <b>{{job.jobName}}</b></div>
        <div v-if="job.properties.country">{{$t('global.layers.country')}}: <b>{{job.properties.country}}</b></div>
        <div>{{$t('jobDetails.layer')}}: <b>{{ $t('global.layers.'+ job.properties.layer) }}</b></div>
        <div>{{$t('jobDetails.lon')}}: <b>{{job.lng}}</b></div>
        <div>{{$t('jobDetails.lat')}}: <b>{{job.lat}}</b></div>
        <v-btn :title="$t('jobDetails.copyLnglat')" flat small icon  @click="copyLngLat()" > <v-icon>content_copy</v-icon> </v-btn>
        <v-btn :title="$t('jobDetails.copyLatlng')" flat small color="primary" icon class="copy-inverted" @click="copyLatLng()" > <v-icon>content_copy</v-icon></v-btn>
      </div>
    </div>
  </box>
</template>

<script src="./job-details.js"></script>
<style scoped src="./job-details.css"></style>
