import React, { Component } from 'react';
import { Platform, View, Text, StyleSheet, ImageBackground, TouchableHighlight, Dimensions, PixelRatio} from 'react-native';
import { Constants, Location, Permissions, KeepAwake, Font } from 'expo';

import './apikey';
const mapQuest = "http://www.mapquestapi.com/geocoding/v1/reverse?key=";
const options = "&includeRoadMetadata=true&thumbMaps=false";
let displayC;
let displayD;
let displayU;

//detecte les dimensions de l'écran
const widthPercentageToDP = widthPercent => {
  const screenWidth = Dimensions.get('window').width;
  // Convert string input to decimal number
  const elemWidth = parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel(screenWidth * elemWidth / 100);
};
const heightPercentageToDP = heightPercent => {
  const screenHeight = Dimensions.get('window').height;
  // Convert string input to decimal number
  const elemHeight = parseFloat(heightPercent);
return PixelRatio.roundToNearestPixel(screenHeight * elemHeight / 100);
};
export {
  widthPercentageToDP,
  heightPercentageToDP
};

class KmH extends Component {
  constructor(props) {
    super(props);

    this.state = {
      latitude: null,
      longitude: null,
      speed: 130,
      maxSpeed: '?',
      maxSpeedActive: true,
      activeColor: null,
      error: null,
      fontLoaded: false,
      speedColor: 'green'
    };
  }
  componentWillMount(){
    if (Platform.OS === 'android' && !Constants.isDevice) {
      this.setState({
        errorMessage: 'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
      });
    } else {
      this._getLocationAsync();
    }
    
  }
  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
      });
    }
  }

  
  async componentDidMount() {
    //Charge la font digital
    await Font.loadAsync({
      'digital': require('./assets/fonts/digital-7.ttf')
    });
    this.setState({ fontLoaded: true })

    //Active/desactive la vitesse maxi
    this._onPressButton = ()=>{
      if(this.state.maxSpeedActive == false){
        this.setState({
          maxSpeedActive : true,
          activeColor : 'white'
        })
        console.log('requete vitesse limite max activée')
        //Requete de la vitesse maxi dans la zone en cours
        this._interval = setInterval(() => {
          if(this.state.latitude != null & this.state.longitude != null){
          fetch(`${mapQuest}${ApiKey}&${this.state.latitude},${this.state.longitude}${options}`, {
            method: 'GET',
          })
          .then((response) => response.json())
          .then((responseJson) => {
            if(responseJson.results[0].locations[0].roadMetadata.speedLimit != null){
              this.setState({
                  maxSpeed : responseJson.results[0].locations[0].roadMetadata.speedLimit
              });
              console.log('MAXSPEED',this.state.maxSpeed)
            } else {
              this.setState({
                maxSpeed : '?'
            });
            }
          })
          .catch((error) => { 
            this.setState({
              maxSpeed : ''
          });
            console.log(error);});
        }}, 20000);
      } else {
        this.setState({
          maxSpeedActive : false,
          activeColor : 'black'
        })
        clearInterval(this._interval);
        console.log('requete vitesse limite max désactivée')
      }
    }
    
    //Requete de la vitesse du vehicule
    this.watchId = await Location.watchPositionAsync({ enableHighAccuracy: true, timeout: 1000, distanceInterval: 1},
      (position) => {
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: Math.round(position.coords.speed*3.6),
          error: null,
        });
        //console.log(this.state.latitude, this.state.longitude)
      },
      (error) => this.setState({ error: error.message })
    );
  }

  componentWillUnmount() {
    //navigator.geolocation.clearWatch(this.watchId);
    clearInterval(this._interval);
  }

  render() {
    console.log('Lat: ',this.state.latitude,this.state.longitude)
    //Séparation et affichage des caractères de la vitesse
    displayU = this.state.speed%10
    if(this.state.speed > 10){
      displayD = Math.round(this.state.speed%100/10)
    } else {
      displayD = ''
    }
    if(this.state.speed > 100){
      displayC = Math.floor(this.state.speed/100)
    } else {
      displayC = ''
    }
    //Couleur des caractéres de la vitesse
    if(this.state.maxSpeed == '' || this.state.speed < this.state.maxSpeed){
      this.state.speedColor = 'green'
    }
    if(this.state.maxSpeed != '' && this.state.speed > this.state.maxSpeed){
      this.state.speedColor = 'orange'
    }
    if(this.state.maxSpeed != '' && this.state.speed > this.state.maxSpeed+5){
      this.state.speedColor = 'red'
    }

    return (
      <View style={{
        flex: 1,
        alignItems: 'flex-end',
        backgroundColor: 'black',
      }}> 
      <KeepAwake /> 
          {
            this.state.fontLoaded ? (
              <View style={{
                width: widthPercentageToDP('100%'),
                height: heightPercentageToDP('70%'),
                
              }}>
              <View style={{
                flex:1,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                //borderColor: 'green',
                //borderWidth: 1,
              }}>
                  <Text style={[styles.vitesse, {color: this.state.speedColor}]}>{displayC}</Text>
                  <Text style={[styles.vitesse, {color: this.state.speedColor}]}>{displayD}</Text>
                  <Text style={[styles.vitesse, {color: this.state.speedColor}]}>{displayU}</Text>
                  {/* <Text style={[styles.vitesse, {color: this.state.speedColor}]}>1</Text>
                  <Text style={[styles.vitesse, {color: this.state.speedColor}]}>1</Text>
                  <Text style={[styles.vitesse, {color: this.state.speedColor}]}>0</Text> */}
                  <Text style={styles.kmh}>Km/h</Text>
                  </View>
              </View>
            ):null
          }
            <View style={{
            width: heightPercentageToDP('30%'),
            height: heightPercentageToDP('30%'),
            borderColor: 'red',
            borderWidth: heightPercentageToDP('5%'),
            borderRadius:360,
            //backgroundColor:this.state.activeColor,
            backgroundColor: 'white'
            }}>
            
        <View style={{
                flex:1,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: this.state.activeColor,
                borderWidth:0,
                borderRadius:360
                //borderColor: 'green',
                //borderWidth: 1,
              }}>
              <TouchableHighlight  onPress={this._onPressButton}>
              <Text style={{fontSize: heightPercentageToDP('10%')}} >{this.state.maxSpeed}</Text>
              </TouchableHighlight>
              </View>
             
            </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  
  paragraph: {
    margin: 24,
    fontSize: 48,
    textAlign: 'center',
    color: 'white'
  },
  vitesse: {
    width: widthPercentageToDP('25%'),
    fontFamily: 'digital',
    fontSize: heightPercentageToDP('75%'),
    textAlign: 'right',
    backgroundColor: 'transparent',
    margin: 0,
    padding: 0,
    //borderColor: 'blue',
    //borderWidth: 1,

  },
  maxSpeed: {
    fontSize: 88,
    textAlign: 'center',
    color: 'black',
  },
  kmh: {
    //width: widthPercentageToDP('5%'),
    fontFamily: 'digital',
    fontSize: heightPercentageToDP('10%'),
    color: 'white',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    //marginRight: 24
}
})
export default KmH;

// import React, {Component} from 'react';
// import {View} from 'react-native';

// export default class MyLayout extends Component {
//   render() {
//     return (
//       <View style={{
//         flex: 1,
//         width: 500,
//         height: 500,
//         alignItems: 'flex-start',
//         padding: 0,
//         flexWrap: 'wrap',
//       }}>
//         <View style={{
//           flex: 1,
//           width: '75%',
//           height: '70%',
//           margin: 0,
//           flexGrow: 1,
//         }} />
// <View style={{
//   flex: 1,
//   width: '25%',
//   height: '70%',
//   justifyContent: 'flex-end',
//   margin: 0,
//   flexGrow: 0,
// }} />
//         <View style={{
//           flex: 1,
//           width: '100%',
//           height: '30%',
//           alignContent: 'flex-end',
//           flexShrink: 1,
//         }} />
//       </View>
//     );
//   }
// };