/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  View,
  TextInput,
  ActivityIndicator,
  Input,
  AsyncStorage,
  ToolbarAndroid,
  DrawerLayoutAndroid,
  Switch,
  TouchableHighlight,
  Text,
} from 'react-native';

import {Navigator} from 'react-native-deprecated-custom-components';

import { Header,Container,Title, Form, Item, Label, Content, List, ListItem, InputGroup, Icon,  Picker, Button, Separator, Left, Right, } from 'native-base';

import * as firebase from 'firebase';

import Login from './screens/login';
import UserData from './screens/userData';
import Main from './screens/main';
import UpdateUserData from './screens/updateUserData'

const firebaseConfig = {
  apiKey: "AIzaSyDdOLBVS7RBio1F_wM8KQk17jAq5m_h49M",
  authDomain: "projektcarcare.firebaseapp.com",
  databaseURL: "https://projektcarcare.firebaseio.com",
  storageBucket: "gs://projektcarcare.appspot.com",
};
const firebaseApp = firebase.initializeApp(firebaseConfig);

export default class Carcare extends Component {
  constructor(props) {
    super(props);

    this.state = {
      drawer: null,
      soundSwitch: false,
      vibrationSwitch: false,
      autologinSwitch: false,
    };

    this.renderScene = this.renderScene.bind(this);
    this.initInstance = this.initInstance.bind(this);
    this.autologinChange = this.autologinChange.bind(this);
  }

  initInstance(instance){
        this.setState({drawer: instance});
    }

    autologinChange(value){
      this.setState({autologinSwitch:value});
      if(value ? AsyncStorage.setItem('autologin','1') : AsyncStorage.setItem('autologin','0'));
    }

    componentDidMount(){
      let autologinValue = AsyncStorage.getItem('autologin');

      if(autologinValue == '1'){
        this.setState({autologinSwitch:true})
      }
    }


  renderScene(route, navigator) {
    console.log(this.state);
    switch(route.name) {
                         case 'updateUserData':
                           return <UpdateUserData nav={navigator} menu={this.state.drawer} fb={firebaseApp} />;
                           break;
                         case 'userData':
                           return <UserData nav={navigator} menu={this.state.drawer} fb={firebaseApp} />;
                           break;
                         case 'main':
                           return <Main nav={navigator} menu={this.state.drawer} fb={firebaseApp} />;
                           break;
                         case 'login':
                         default:
                           return <Login nav={navigator} menu={this.state.drawer} fb={firebaseApp} />;
                         }
  }

  render() {
    const routes = [
        {name: 'login'},
      ];

      var navigationView = (
       <View style={{flex: 1, backgroundColor: '#141829'}}>
         <Container>
          <Content>
            <Separator bordered>
              <Text style={{ fontSize: 18}}>Ustawienia</Text>
            </Separator>
            <ListItem style={{flex: 1, flexDirection:'row'}}>
              <Text style={{ color: '#fff' }}>Wyłącz dzwięk</Text>
              <Right>
              <Switch
                onValueChange={(value) => this.setState({soundSwitch: value})}
                style={{marginBottom: 10}}
                value={this.state.soundSwitch} />
              </Right>
            </ListItem>
            <ListItem style={{flex: 1, flexDirection:'row'}}>
              <Text style={{ color: '#fff' }}>Wyłącz wibrację</Text>
              <Right>
              <Switch
               onValueChange={(value) => this.setState({vibrationSwitch: value})}
               value={this.state.vibrationSwitch} />
              </Right>
            </ListItem>
            <ListItem style={{flex: 1, flexDirection:'row'}}>
              <Text style={{ color: '#fff' }}>Włącz autologowanie</Text>
              <Right>
              <Switch
                onValueChange={(value) => this.autologinChange(value)}
                style={{marginBottom: 10}}
                value={this.state.autologinSwitch} />
              </Right>
            </ListItem>

            <ListItem>
              <TouchableHighlight onPress={ () => {this.state.drawer.closeDrawer();
                this.navigator.push({
                name: 'updateUserData'
              }); }}>
                <Text style={{ color: '#fff' }}>Zmień dane</Text>
              </TouchableHighlight>
            </ListItem>

            <ListItem>
              <Text style={{ color: '#fff' }}>Zablokuj użytkownika</Text>
            </ListItem>
            <ListItem>
              <Text style={{ color: '#fff' }}>Dodaj pojazd</Text>
            </ListItem>
            <Separator>
              <Text style={{ fontSize: 18}}>Informacje o aplikacji</Text>
            </Separator>
            <ListItem>
              <Text style={{ color: '#fff' }}>Komunikaty</Text>
            </ListItem>
            <ListItem>
              <Text style={{ color: '#fff' }}>O nas</Text>
            </ListItem>
            <ListItem>
              <Text style={{ color: '#fff' }}>Regulamin</Text>
            </ListItem>
            <ListItem>
              <Text style={{ color: '#fff' }}>Polityka prywatności</Text>
            </ListItem>

          </Content>
         </Container>
       </View>
          );

      return (
        <View style={{flex: 1}}>

        <DrawerLayoutAndroid
           ref={this.initInstance}
           drawerWidth={300}
           drawerPosition={DrawerLayoutAndroid.positions.Left}
           renderNavigationView={() => navigationView}>
           <Navigator
             initialRoute={routes[0]}
             renderScene={this.renderScene}
             ref={(nav) => this.navigator = nav }
           />

        </DrawerLayoutAndroid>

      </View>
      );
  }
}

const styles = StyleSheet.create({
  navigator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141829',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141829',
  },
  listItem: {
    color: '#fff',
    fontSize: 18,
    padding: 2,
  },
});

AppRegistry.registerComponent('Carcare', () => Carcare);
