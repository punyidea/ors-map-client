<template>
<!--  <v-card elevation="3" style="margin: 5px;" v-for="(j, i) in jobs" :key="i">
    <v-card-title style="padding-bottom: 0;"><v-icon style="padding: 0 5px 0 0">local_shipping</v-icon><b>Job {{j.id}} ({{j.jobName}})</b></v-card-title>
    <v-card-text>
      <div>Location: {{j.location}}</div>
      <template v-for="prop in ['service','amount','skills','time_window']">
        <div v-if="v[prop]" style="flex: auto">{{ $t(`optimization.${prop}`) }}: {{ j[prop] }}</div>
      </template>
    </v-card-text>
  </v-card>-->
</template>

<script src="./edit-jobs.js"></script>
<style scoped src="./edit-jobs.css"></style>
