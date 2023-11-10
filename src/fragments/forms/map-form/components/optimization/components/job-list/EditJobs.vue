<template>
  <div>
    <v-dialog v-model="isJobsOpen" max-width="600" :persistent="true" attach="body">
      <box background="white" v-if="isJobsOpen" class="jobs-modal" resizable closable @closed="closeJobsModal()">
        <h3 slot="header" style="padding-right: 55px">
          {{ $t('optimization.manageJobs') }}
          <v-btn class="export-btn" flat :style="{background: 'white'}" slot="title" @click="exportJobs()" :title="$t('optimization.exportJobFile')">
            <v-icon color="primary">cloud_download</v-icon>
          </v-btn>
          <v-btn class="import-btn" flat :style="{background: 'white'}" slot="title" @click="importJobs()" :title="$t('optimization.importJobFile')">
            <v-icon color="primary">cloud_upload</v-icon>
          </v-btn>
        </h3>
        <v-card elevation="3" style="margin: 5px;" v-for="(j, i) in jobs" :key="i">
          <v-card-title style="padding-bottom: 0;"><b>Job {{ j.id }}</b></v-card-title>
          <v-card-text>
            <div>Location: {{ JSON.stringify(j) }}</div>
            <!--        <div>Location: {{ j.location }}</div>
                    <template v-for="prop in ['service','amount','skills','time_window']">
                      <div v-if="v[prop]" style="flex: auto">{{ $t(`optimization.${prop}`) }}: {{ j[prop] }}</div>
                    </template>-->
          </v-card-text>
        </v-card>
      </box>
    </v-dialog>
  </div>
</template>

<script src="./edit-jobs.js"></script>
<style scoped src="./edit-jobs.css"></style>
