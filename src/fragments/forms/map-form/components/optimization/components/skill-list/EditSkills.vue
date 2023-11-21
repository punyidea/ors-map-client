<template>
  <div>
    <v-dialog v-model="isSkillsOpen" max-width="400" :persistent="true" attach="body">
      <box background="white" class="skills-modal" closable @closed="closeSkillsModal()">
        <h3 slot="header" style="padding-right: 55px">
          {{ $t('optimization.manageSkills') }}
<!--          <v-btn class="edit-jobs-btn" flat :style="{background: 'white'}" @click="exportJobs()" :title="$t('optimization.exportJobFile')">
            <v-icon color="primary">cloud_download</v-icon>
          </v-btn>
          <v-btn class="edit-jobs-btn" flat :style="{background: 'white'}" @click="importJobs()" :title="$t('optimization.importJobFile')">
            <v-icon color="primary">cloud_upload</v-icon>
          </v-btn>
          <v-btn class="edit-jobs-btn" flat :style="{background: 'white'}" @click="saveJobs()" :title="$t('optimization.saveJobs')">
            <v-icon color="success">save</v-icon>
          </v-btn>
          <v-btn class="edit-jobs-btn" flat :style="{}" @click="addJob(true)" :title="$t('optimization.addJob')">
            <v-icon color="info">add</v-icon>
          </v-btn>-->
        </h3>
        <v-layout row :wrap="$lowResolution">
          <v-spacer class="hidden-md-and-down"></v-spacer>
          <v-flex text-xs-right xs12 sm5 md7 :class="{'ml-2': $vuetify.breakpoint.smAndDown, 'mb-2': $lowResolution}">
            <v-btn :block="$lowResolution" color="primary" :title="$t('settings.restoreDefaults')"
                   @click="closeSkillsModal">{{$t('global.cancel')}}</v-btn>
          </v-flex>
          <v-flex text-xs-right xs12 sm3 md3 :class="{'ml-2': $vuetify.breakpoint.smAndDown}">
            <v-btn :block="$lowResolution" color="info" :title="$t('optimization.addJob')" @click="addSkill(true)">
              {{$t('optimization.addJob')}}</v-btn>
          </v-flex>
          <v-flex text-xs-right xs12 sm3 md3 :class="{'ml-2': $vuetify.breakpoint.smAndDown}">
            <v-btn :block="$lowResolution" color="success" :title="$t('global.save')" @click="saveSkills">
              {{$t('global.save')}}</v-btn>
          </v-flex>
        </v-layout>
      </box>
    </v-dialog>
  </div>
</template>

<script src="skill-list.js"></script>
<style scoped src="skill-list.css"></style>
