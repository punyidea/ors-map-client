<template>
  <div>
    <v-form style="background:white" @submit.prevent>
      <template >
        <ul class="job-inputs">
          <draggable v-model="jobs" @end="onReordered()" handle=".reorder-handle">
            <li :key="index" v-for="(job, index) in getJobs">
              <v-layout row >
                <v-flex v-bind="{[ $store.getters.mode === constants.modes.optimization? 'sm10 md11' : 'sm12']: true}">
                  <place-input :ref="'job'+index"
                               id-postfix="optimization"
                               :support-directions=false
                               :optimization-button-tooltip="$store.getters.isSidebarVisible && active"
                               optimization-button-tooltip-position="right"
                               :support-search=false
                               :box="jobs.length === 1"
                               :index="index"
                               :model="jobs[index]"
                               :single="jobs.length === 1"
                               :is-last="(jobs.length -1) === index && index !== 0"
                               @removeInput="removeJobInput">
                  </place-input>
                </v-flex>
              </v-layout >
            </li>
          </draggable>
        </ul>
      </template>
      <v-layout row class="form-actions-btns">
        <form-actions :place-inputs="jobs.length" :disabled-actions="disabledActions"
                      @addPlaceInput="addInput"
                      @clearPlaces="clearJobs"
                      @contentUploaded="contentUploaded">
        </form-actions>
      </v-layout>
    </v-form>
  </div>
</template>

<script src="./optimization.js"></script>
<style scoped src="./optimization.css"></style>

