<template>
  <box background="white" no-shadow>
    <div slot="header">
      <download :download-formats-supported="['json', 'geojson']" :map-view-data="localMapViewData"></download>
      <share :url="shareUrl"></share>
      <print :map-view-data="localMapViewData"></print>
      <h3>{{$t('optimizationDetails.optimizationDetails')}}</h3>
    </div>
    <div  style="padding:0 0 0 10px" v-if="parsedRoutes?.unassigned > 0">
      <h4 >{{$t('optimizationDetails.warnings')}}:</h4>
      <v-alert type="warning" style="color:black" >{{$t('optimizationDetails.warningUnassigned')}}</v-alert>
    </div>
    <div>{{parsedRoutes}}</div>
  </box>
</template>
<script src="./optimization-details.js">

</script>
<style scoped src="./optimization-details.css"></style>
