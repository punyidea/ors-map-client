<template>
  <div>
    <v-layout row wrap >
      <v-flex v-bind="{[inputColumns]: true}">
        <v-text-field class="job-input"
                      v-focus="hasAutomaticFocus"
                      v-model="model.jobName"
                      clearable
                      flat
                      :box="box"
                      :hide-details="hideDetails"
                      :hint="hint"
                      :persistent-hint="!hideDetails"
                      :height="height"
                      :style="{'margin-bottom': mb +'px'}"
                      :disabled="disabled"
                      :label="jobInputLabel"
                      @click="setFocus(true)"
                      @focus="inputFocused($event)"
                      @keyup="changed($event)"
                      @click:clear="() => jobCleared(index)">
          <template v-slot:append v-if="searchAvailable">
            <v-btn v-if="appendBtn === 'search'" icon small flat class="append-input-btn search" :title="$t('jobInput.clickToSearchAndShowResultsOnTheMap')"
                   @click="sendToSearchMode()">
              <v-icon left>search</v-icon>
            </v-btn>
          </template>
          <template v-slot:append-outer>
            <v-btn v-if="appendBtn === 'map'" icon small flat class="append-input-btn" :title="$t('jobInput.clickOnTheMapBtnToPickAJob')"
                   @click="pickJobClick($event)"
                   v-smart-tooltip="{show: showInputPickJobTooltip, text: $t('jobInput.clickOnTheMapBtnToPickAJob'), position: 'bottom', dark: true, showOnce: true, name: 'pickAJobOnTheMap'}">
              <v-icon left>map</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </v-flex>
    </v-layout>
  </div>
</template>

<script src="./job-input.js"></script>

<style scoped src="./job-input.scss"></style>
