<template>
  <div>
    <v-form @submit.prevent style="background:white">
      <template  v-if="places.length > 0">
        <template v-if="mapViewData">
          <optimization-details v-if="mapViewData && mapViewData.hasPlaces()" :map-view-data="mapViewData"></optimization-details>
          <br>
        </template>
        <div class="optimization-heading">
          {{ $t('optimization.jobs') }}
          <v-tooltip bottom style="float: right">
            <template v-slot:activator="{ on }">
              <v-btn class="no-padding" v-if="$mdAndUpResolution"
                     icon small @click="manageJobs">
                <v-icon :title="$t('optimization.manageJobs')" color="dark" :medium="$lowResolution">settings</v-icon>
              </v-btn>
            </template>
            {{ $t('optimization.manageJobs') }}
          </v-tooltip>
        </div>
<!--        <ul class="job-inputs">-->
<!--          <li :key="index" v-for="(place, index) in jobs">-->
<!--            <v-layout row >-->
<!--              <v-flex v-bind="{[ $store.getters.mode === constants.modes.optimization? 'xs11' : 'xs12']: true}">-->
<!--                <place-input :ref="'job'+index"-->
<!--                             id-postfix="job"-->
<!--                             :support-directions="false"-->
<!--                             :support-search="false"-->
<!--                             pick-place-supported-->
<!--                             :box="places.length === 1"-->
<!--                             :index="index"-->
<!--                             :model="places[index]"-->
<!--                             :single="places.length === 1"-->
<!--                             :is-last="(places.length -1) === index && index !== 0"-->
<!--                             @selected="selectPlace"-->
<!--                             @removeInput="removePlaceInput"-->
<!--                             @addInput="addPlaceInput"-->
<!--                             @cleared="placeCleared">-->
<!--                </place-input>-->
<!--              </v-flex>-->
<!--            </v-layout >-->
<!--          </li>-->
<!--        </ul>-->
        <job-list :jobs="jobs"></job-list>
        <div class="optimization-heading">
          {{ $t('optimization.vehicles') }}
          <v-tooltip bottom style="float: right">
            <template v-slot:activator="{ on }">
              <v-btn class="no-padding" v-if="$mdAndUpResolution"
                     icon small @click="manageJobs">
                <v-icon :title="$t('optimization.manageVehicles')" color="dark" :medium="$lowResolution">settings</v-icon>
              </v-btn>
            </template>
            {{ $t('optimization.manageVehicles') }}
          </v-tooltip>
        </div>
      </template>
      <v-card elevation="3" style="margin: 5px;" v-for="(v, i) in vehicles" :key="i">
        <v-card-title style="padding-bottom: 0;"><v-icon :color="vehicleColors(v.id)" style="padding: 0 5px 0 0">local_shipping</v-icon><b>Vehicle {{v.id}} ({{v.profile}})</b></v-card-title>
        <v-card-text>
          <template v-for="prop in ['capacity','skills','time_window']">
            <div v-if="v[prop]" style="flex: auto">{{ $t(`optimization.${prop}`) }}: {{ v[prop] }}</div>
          </template>
        </v-card-text>
      </v-card>
      <v-layout row class="form-actions-btns">
        <form-actions :place-inputs="places.length" :disabled-actions="disabledActions"
                      @addPlaceInput="addPlaceInput"
                      @clearPlaces="clearPlaces"
                      @reverseRoute="reverseRoute"
                      @contentUploaded="contentUploaded">
        </form-actions>
      </v-layout>
    </v-form>
  </div>
</template>
<script src="./optimization.js">
</script>
<style scoped src="./optimization.css">
</style>
