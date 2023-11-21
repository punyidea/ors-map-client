<template>
  <div>
    <v-form @submit.prevent style="background:white">
      <template>
        <template v-if="mapViewData">
          <optimization-details v-if="mapViewData.hasRoutes()" :map-view-data="mapViewData"></optimization-details>
          <br>
        </template>
        <div class="optimization-heading">
          {{ $t('optimization.jobs') }} (Max: 50)
          <v-tooltip bottom style="float: right">
            <template v-slot:activator="{ on }">
              <v-btn class="no-padding"
                     icon small @click="manageJobs">
                <v-icon :title="$t('optimization.manageJobs')" color="dark" :medium="$lowResolution">settings</v-icon>
              </v-btn>
            </template>
            {{ $t('optimization.manageJobs') }}
          </v-tooltip>
        </div>
      </template>
      <job-list :jobs="jobs"></job-list>
      <div class="optimization-heading">
        {{ $t('optimization.vehicles') }} (Max: 3)
        <v-tooltip bottom style="float: right">
          <template v-slot:activator="{ on }">
            <v-btn class="no-padding"
                   icon small @click="manageVehicles">
              <v-icon :title="$t('optimization.manageVehicles')" color="dark" :medium="$lowResolution">settings</v-icon>
            </v-btn>
          </template>
          {{ $t('optimization.manageVehicles') }}
        </v-tooltip>
      </div>
      <v-card elevation="3" style="margin: 5px;" v-for="(v, i) in vehicles" :key="i">
        <v-card-title style="padding-bottom: 0;"><v-icon :color="vehicleColors(v.id)" style="padding: 0 5px 0 0">local_shipping</v-icon><b>Vehicle {{v.id}} ({{v.profile}})</b></v-card-title>
        <v-card-text>
          <template v-for="prop in ['capacity','skills','time_window']">
            <v-chip v-if="v[prop]" style="flex: auto">{{ $t(`optimization.${prop}`) }}: {{ v[prop] }}</v-chip>
          </template>
        </v-card-text>
      </v-card>
      <v-layout row class="form-actions-btns">
        <form-actions :place-inputs="jobs.length" :disabled-actions="disabledActions"
                      @addPlaceInput="addPlaceInput"
                      @clearPlaces="clearPlaces"
                      @reverseRoute="reverseRoute"
                      @contentUploaded="contentUploaded">
        </form-actions>
      </v-layout>
    </v-form>
    <edit-jobs v-if="showJobManagement" :jobs="jobs" @jobsChanged="jobsChanged" @close="showJobManagement=false"></edit-jobs>
    <edit-vehicles v-if="showVehicleManagement" :vehicles="vehicles" @vehiclesChanged="vehiclesChanged" @close="showVehicleManagement=false"></edit-vehicles>
  </div>
</template>

<script src="./optimization.js"></script>
<style scoped src="./optimization.css"></style>
