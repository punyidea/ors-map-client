<script src="./optimization.js">
</script>

<template>
  <div>
    <v-form @submit.prevent style="background:white">
      <template  v-if="places.length > 0">
        <div class="optimization-heading">Vehicles:</div>
        <v-card elevation="3" color="info" style="margin: 5px;">
          <v-card-title>Vehicle 1</v-card-title>
          <v-card-text>car, start, end</v-card-text>
        </v-card>
        <div class="optimization-heading">Jobs:</div>
        <ul class="place-inputs">
          <draggable v-model="places" @end="onReordered()" handle=".reorder-handle">
            <li :key="index" v-for="(place, index) in places">
              <v-layout row >
                <v-flex v-bind="{[ $store.getters.mode === constants.modes.optimization? 'xs11' : 'xs12']: true}">
                  <place-input :ref="'job'+index"
                               id-postfix="job"
                               :support-directions="false"
                               :support-search="false"
                               pick-place-supported
                               :box="places.length === 1"
                               :index="index"
                               :model="places[index]"
                               :single="places.length === 1"
                               :is-last="(places.length -1) === index && index !== 0"
                               @selected="selectPlace"
                               @removeInput="removePlaceInput"
                               @addInput="addPlaceInput"
                               @cleared="placeCleared">
                  </place-input>
                </v-flex>
              </v-layout >
            </li>
          </draggable>
        </ul>
      </template>
      <v-layout row class="form-actions-btns">
        <form-actions :place-inputs="places.length" :disabled-actions="disabledActions"
                      @addPlaceInput="addPlaceInput"
                      @clearPlaces="clearPlaces"
                      @reverseRoute="reverseRoute"
                      @contentUploaded="contentUploaded">
        </form-actions>
      </v-layout>
      <template v-if="mapViewData">
        <optimization-details v-if="mapViewData && mapViewData.hasPlaces()" :map-view-data="mapViewData"></optimization-details>
        <br>
      </template>
      <br>
    </v-form>
  </div>
</template>

<style scoped src="./optimization.css">

</style>
