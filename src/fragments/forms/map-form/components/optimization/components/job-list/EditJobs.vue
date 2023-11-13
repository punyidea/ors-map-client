<template>
  <div>
    <v-dialog v-model="isJobsOpen" max-width="600" :persistent="true" attach="body">
      <box background="white" class="jobs-modal" resizable closable @closed="closeJobsModal()">
        <h3 slot="header" style="padding-right: 55px">
          {{ $t('optimization.manageJobs') }}  {{ `editing ${editId}`}}
          <v-btn class="edit-jobs-btn" flat :style="{background: 'white'}" @click="exportJobs()" :title="$t('optimization.exportJobFile')">
            <v-icon color="primary">cloud_download</v-icon>
          </v-btn>
          <v-btn class="edit-jobs-btn" flat :style="{background: 'white'}" @click="importJobs()" :title="$t('optimization.importJobFile')">
            <v-icon color="primary">cloud_upload</v-icon>
          </v-btn>
          <v-btn class="edit-jobs-btn" flat :style="{background: 'white', 'padding-right':'15px'}" @click="saveJobs()" :title="$t('optimization.saveJobs')">
            <v-icon color="success">save</v-icon>
          </v-btn>
        </h3>
        <v-card @click="editId = i+1" elevation="3" style="margin: 5px;cursor: pointer" v-for="(j, i) in editJobs" :key="i">
          <v-card-title style="padding-bottom: 0;">
            <div><b>Job {{ j.id }}</b></div>
            <v-btn v-if="editId === j.id" class="edit-btn" flat small :style="{background: 'white'}" @click.stop="editId = 0" :title="$t('optimization.editJob')">
              <v-icon color="primary">edit</v-icon>
            </v-btn>
            <v-btn class="remove-btn" small icon :style="{background: 'white'}" @click.stop="removeJob(j.id)" :title="$t('optimization.removeJob')">
              <v-icon color="primary">delete</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="editId !== j.id">Location: {{ j }}</div>
            <div v-else>
              <v-text-field v-model="editJobs[i].location" :persistent-hint="true" :hint="'Location'"></v-text-field>
              <v-text-field v-model="editJobs[i].service" :persistent-hint="true" :hint="'ServiceTime'"></v-text-field>
              <v-text-field v-model="editJobs[i].amount" :persistent-hint="true" :hint="'Amount'"></v-text-field>
              <v-text-field v-model="editJobs[i].skills" :persistent-hint="true" :hint="'Skills needed for this Job'"></v-text-field>
            </div>
            <!--        <div>Location: {{ j.location }}</div>
                    <template v-for="prop in ['service','amount','skills','time_window']">
                      <div v-if="v[prop]" style="flex: auto">{{ $t(`optimization.${prop}`) }}: {{ j[prop] }}</div>
                    </template>-->
          </v-card-text>
        </v-card>
        <v-layout row :wrap="$lowResolution">
          <v-spacer class="hidden-md-and-down"></v-spacer>
          <v-flex text-xs-right xs12 sm5 md7 :class="{'ml-2': $vuetify.breakpoint.smAndDown, 'mb-2': $lowResolution}">
            <v-btn :block="$lowResolution" color="primary" :title="$t('settings.restoreDefaults')"
                   @click="closeJobsModal">{{$t('global.cancel')}}</v-btn>
          </v-flex>
          <v-flex text-xs-right xs12 sm3 md3 :class="{'ml-2': $vuetify.breakpoint.smAndDown}">
            <v-btn :block="$lowResolution" color="success" :title="$t('global.save')" @click="saveJobs">
              {{$t('global.save')}}</v-btn>
          </v-flex>
        </v-layout>
      </box>
    </v-dialog>
  </div>
</template>

<script src="./edit-jobs.js"></script>
<style scoped src="./edit-jobs.css"></style>
