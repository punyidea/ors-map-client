<template>
  <box background="white" no-shadow>
    <div slot="header">
      <download :download-formats-supported="['json', 'geojson']" :map-view-data="localMapViewData"></download>
      <share :url="shareUrl"></share>
      <print :map-view-data="localMapViewData"></print>
      <h3>{{$t('optimizationDetails.optimizationDetails')}}</h3>
    </div>
    <v-expansion-panel slot="content" class="no-shadow" v-if="hasRoutes" :value="panelExtended" :expand="true">
      <v-expansion-panel-content style="background: transparent;" class="routes-header" :key="routeIndex" v-for="(route, routeIndex) in parsedRoutes">
        <div slot="header">
          <h4 >{{$t('routeDetails.route')}} {{routeIndex + 1}} (Vehicle {{route.vehicle}})
            <v-btn icon @click.stop="changeActiveRouteIndex(routeIndex)" v-if="parsedRoutes.length > 1" :title="routeIndex === $store.getters.activeRouteIndex? $t('routeDetails.selectedRoute') : $t('routeDetails.selectRoute')">
              <v-icon :color="routeIndex === $store.getters.activeRouteIndex? 'primary' : 'dark' " >done</v-icon>
            </v-btn>
          </h4>
        </div>
        <div style="padding:0 0 0 10px; display: flex; flex-wrap:wrap; flex-grow: initial">
          <template v-for="prop in ['distance','duration','service','delivery','pickup','waiting_time']">
            <div v-if="route[prop]" style="flex: auto">{{ $t(`optimizationDetails.${prop}`) }}: {{ route[prop] }}</div>
          </template>
        </div>

        <v-list>
          <v-divider></v-divider>
          <v-list dense class="route-details">
            <div  style="padding:0 0 0 10px" v-if="route.violations">
              <h4 >{{$t('routeDetails.warnings')}}:</h4>
              <v-alert :key="warning.code" v-for="warning in route.violations" :value="getWarningTranslated(warning)"  type="warning" style="color:black" >{{ getWarningTranslated(warning) }}</v-alert>
            </div>
            <div v-if="route.steps > 1" class="route-container">
              <v-expansion-panel class="no-shadow" v-if="hasRoutes" :value="route.steps.length === 1 ? 0 : null">
                <v-expansion-panel-content class="route-panel">
                  <v-list dense>
                    <optimization-steps :steps="route.steps"></optimization-steps>
                  </v-list>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </div>
            <div class="route-container">
              <div style="padding:0 0 0 5px">
                <v-expansion-panel class="no-shadow" v-if="hasRoutes" :value="null">
                  <v-expansion-panel-content class="route-panel" style="background: transparent;" >
                    <div slot="header"><h4 >{{$t('optimizationDetails.steps')}}</h4></div>
                    <v-list class="instructions-scroll">
                      <v-divider></v-divider>
                      <v-list dense>
                        <optimization-steps :steps="route.steps"></optimization-steps>
                      </v-list>
                    </v-list>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </div>
            </div>
          </v-list>
        </v-list>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </box>
</template>
<script src="./optimization-details.js">

</script>
<style scoped src="./optimization-details.css"></style>
