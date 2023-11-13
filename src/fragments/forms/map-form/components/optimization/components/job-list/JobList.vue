<template>
  <div class="job-inputs">
<!--    <v-card elevation="1" style="margin: 5px;" >-->
      <v-expansion-panel  class="no-shadow" :value="jobExtended" :expand="true">
        <v-expansion-panel-content style="background: transparent;" v-for="(j, i) in jobs" :key="i">
          <div slot="header" style="padding-bottom: 0;"><v-icon style="padding: 0 5px 0 0">local_shipping</v-icon><b>Job {{j.id}} - {{ j.location[0].toPrecision(8) }}, {{ j.location[1].toPrecision(8)}}</b></div>
          <div style="padding:0 0 0 10px; display: flex; flex-wrap:wrap; flex-grow: initial">
            <template v-for="prop in ['amount','service','skills','time_window']">
              <div v-if="j[prop]" style="flex: auto">{{ $t(`job.${prop}`) }}: {{ j[prop] }}</div>
            </template>
          </div>
        </v-expansion-panel-content>
      </v-expansion-panel>
<!--    </v-card>-->
  </div>
</template>
<script src="./job-list.js"></script>
<style scoped src="./job-list.css"></style>
