import React, { Component } from 'react';
import { Platform, View, Text, StyleSheet, ImageBackground, TouchableHighlight, Dimensions, PixelRatio} from 'react-native';
import { Constants, Location, Permissions, KeepAwake, Font } from 'expo';

const mapquestapikey =require('./apikey.js');
const ApiKey = mapquestapikey.ApiKey
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
      lastLatitude: null,
      lastLongitude: null,
      latitude: null,
      longitude: null,
      speed: 0,
      lastSpeed: null,
      speedDisplay: 0,
      currentTime: null,
      lastTime: null,
      acceleration: 1,
      maxSpeed: '?',
      maxSpeedActive: true,
      maxSpeedInterval: null,
      activeColor: null,
      error: null,
      errorMessage: null,
      fontLoaded: false,
      speedColor: 'green',
      hourMinutes:''
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
          activeColor : 'white',
          maxSpeedInterval: setInterval(this.funcMaxSpeed,20000)
        })
        console.log('requete vitesse limite max activée')
      } else {
        this.setState({
          maxSpeedActive : false,
          activeColor : 'black',
          maxSpeedInterval: clearInterval(this.state.maxSpeedInterval)
        })
        console.log('requete vitesse limite max désactivée')
      }
    }

    //Requete de la vitesse maxi dans la zone en cours
      this.funcMaxSpeed = ()=>{
      console.log("requete vitesse maxi !!!")
      if(this.state.latitude != null & this.state.longitude != null){
        console.log("here!!!")
        //https://www.overpass-api.de/api/interpreter?data=[out:json];node[highway=speed_camera](43.46669501043081,-5.708215989569187,43.588927989569186,-5.605835010430813);out%20meta;
      fetch(`${mapQuest}${ApiKey}&${this.state.latitude},${this.state.longitude}${options}`, {
        method: 'GET',
      })
      .then((response) => response.json())
      .then((responseJson) => {
        if(responseJson.results[0].locations[0].roadMetadata.speedLimit != null){
          console.log(responseJson.results[0].locations[0])
          this.setState({
              maxSpeed : responseJson.results[0].locations[0].roadMetadata.speedLimit
          });
          console.log('MAXSPEED',this.state.maxSpeed)
        } else {
          this.setState({
            maxSpeed : '?'
        });
        console.log("no result")
        }
      })
      .catch((error) => { 
        this.setState({
          maxSpeed : '?'
      });
      if(this.state.maxSpeedActive == false){
        clearInterval(this.funcMaxSpeed);
      }
        console.log(error);});
    }}
    //Requete de la vitesse du vehicule
    this.watchId = await Location.watchPositionAsync({ enableHighAccuracy: true, timeout: 1000, distanceInterval: 1},
      (position) => {
        let lat = +(position.coords.latitude).toFixed(5)
        let lon = +(position.coords.longitude).toFixed(5)
        //console.log('lat:',lat,'lon:',lon)
        if(this.state.lastLatitude == null){
          this.setState({
            lastLatitude: +(position.coords.latitude).toFixed(5),
            lastLongitude: +(position.coords.latitude).toFixed(5),
            lastSpeed: 0
          })
        }
        if(Math.abs(lat-this.state.lastLatitude) > 0 || Math.abs(lon-this.state.lastLongitude) > 0 ){
          let t = new Date(position.timestamp).toLocaleTimeString("fr-FR");
          t = t.substring(0, t.length-3);
          this.setState({
            lastLatitude: this.state.latitude,
            lastLongitude: this.state.longitude, 
            latitude: lat,
            longitude: lon,
            lastSpeed: this.state.speed,
            speed: Math.round(position.coords.speed*3.6),
            hourMinutes: t,
            error: null,
          });
        } else {
          console.log("Rejected | lat:",lat,',lon:',lon,' Difference:',Math.abs(lat-this.state.lastLatitude),',',Math.abs(lon-this.state.lastLongitude),'speed:',this.state.speed)
        }
      },
      (error) => this.setState({ error: error.message })
    );
    //Incrementation du compteur de facon realiste
    this._intervalDisplay = setInterval(() => {
      if (this.state.speedDisplay < this.state.speed) {
        this.setState({
          speedDisplay: this.state.speedDisplay+1
        })
      } else if (this.state.speedDisplay > this.state.speed) {
        this.setState({
          speedDisplay: this.state.speedDisplay-1
        })
      }
      }, 50); 
    };
  

  componentWillUnmount() {
    this.setState({maxSpeedInterval: clearInterval(this.state.maxSpeedInterval)})
    clearInterval(this._intervalDisplay);
  }

  render() {
    console.log('Lat: ',this.state.latitude,this.state.longitude)
    //console.log(this.state.speedDisplay)
    //Séparation et affichage des caractères de la vitesse
    displayU = this.state.speedDisplay%10
    if(this.state.speed > 10){
      displayD = Math.floor(this.state.speedDisplay%100/10)
    } else {
      displayD = ''
    }
    if(this.state.speed > 100){
      displayC = Math.floor(this.state.speedDisplay/100)
    } else {
      displayC = ''
    }
    //Couleur des caractéres de la vitesse
    if(this.state.maxSpeed == '' || this.state.speedDisplay < this.state.maxSpeed){
      this.state.speedColor = 'green'
    }
    if(this.state.maxSpeed != '' && this.state.speedDisplay > this.state.maxSpeed){
      this.state.speedColor = 'orange'
    }
    if(this.state.maxSpeed != '' && this.state.speedDisplay > this.state.maxSpeed+5){
      this.state.speedColor = 'red'
    }

    return (
      <View style={{
        flex: 1,
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
                flex:1,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              {
            this.state.fontLoaded ? (
              <Text style={{fontSize: heightPercentageToDP('10%'),fontFamily: 'digital',fontSize: heightPercentageToDP('20%'),color:'white',marginLeft:widthPercentageToDP('5%')}} >{this.state.hourMinutes}</Text>
              ):null
              }
            <View style={{
            width: heightPercentageToDP('30%'),
            height: heightPercentageToDP('30%'),
            borderColor: 'red',
            borderWidth: heightPercentageToDP('5%'),
            borderRadius:360,
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
              }}>
              <TouchableHighlight  onPress={() =>this._onPressButton()}>
              <Text style={{fontSize: heightPercentageToDP('10%')}} >{this.state.maxSpeed}</Text>
              </TouchableHighlight>
              </View>
             
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

