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
  Navigator,
  PermissionsAndroid,
  Modal,
} from 'react-native';

import { Header,Container,Title, Form, Item, Label, Content, List, ListItem, Left, Right, Body, InputGroup, Icon, Text, Picker, Button } from 'native-base';

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      email: 'test@test.pl',
      pass: 'test123',
      content: null,
      getpermission: false,
      modalVisible: false,
    };

    this.onLogin = this.onLogin.bind(this);
    this.onRegister = this.onRegister.bind(this);
    this.requestLocationPermission = this.requestLocationPermission.bind(this);

  }

  componentDidMount(){
    const menu = this.props.menu;

    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then(() => {
      this.setState({getpermission: true});
      console.log('ma');
    }, () => {
      console.log('nie ma');
      this.requestLocationPermission();
    });

    // menu.drawerLockMode = 'locked-close';
  }

    async requestLocationPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          'title': 'Pozwolenie na lokalizowanie telefonu',
          'message': 'Do poprawnego działania aplikacji, potrzebna jest uruchomiona lokalizacja.'
        }
      )
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use the camera")
        this.setState({getpermission: true});
      } else {
        this.setState({getpermission: false});
      }
    } catch (err) {
      console.warn(err)
    }
  }

  componentWillReceiveProps(nextProps) {
    console.log(nextProps.menu);
  }

  setModalVisible(visible){
    this.setState({modalVisible: visible});
  }

  onLogin() {

    if(this.state.getpermission) {
      AsyncStorage.multiGet(['email','password','autologin']).then((data) =>{

      let email = data[0][1];
      let password = data[1][1];
      let autologin = data[2][1];

      console.log('dupa '+email+" "+password+" "+autologin);

      if ( autologin == '1') {
        if(email != null && password != null){
            this.setState({loading : true});
            this.props.fb.auth().signInWithEmailAndPassword(email,password).then((userData)=>
            {
                  const userId = this.props.fb.auth().currentUser.uid;

                  this.props.fb.database().ref('/users/' + userId).once('value').then(function(data) {
                    this.setState({
                          loading: false,
                        });
                    if(data.val() != null) {
                      this.props.nav.push({
                        name: 'main',
                      });
                    } else {
                      this.props.nav.push({
                        name: 'userData',
                      });
                    }
                  }.bind(this))
            })
        }
      }
    }

    )
      if(this.state.email && this.state.pass ) {
        this.setState({loading : true});
        this.props.fb.auth().signInWithEmailAndPassword(this.state.email, this.state.pass)
        .then((userData) =>
        {
          //AsyncStorage.setItem('userData', JSON.stringify(userData));
          AsyncStorage.multiSet([
            ["email", this.state.email],
            ["password", this.state.pass]
          ])
          const userId = this.props.fb.auth().currentUser.uid;

          this.props.fb.database().ref('/users/' + userId).once('value').then(function(data) {
            this.setState({
                  loading: false,
                });
            if(data.val() != null) {
              this.props.nav.push({
                name: 'main',
              });
            } else {
              this.props.nav.push({
                name: 'userData',
              });
            }
          }.bind(this))
        }
      ).catch((error) =>
          {
                this.setState({
                  loading: false
                });
          alert('Login Failed. Please try again'+error);
      });
      }
    } else {
      this.requestLocationPermission();
    }

  };

  onRegister() {
    if(this.state.getpermission) {
      if(this.state.email && this.state.pass) {
        this.setModalVisible(false);
        this.setState({loading : true});
        this.props.fb.auth().createUserWithEmailAndPassword(this.state.email, this.state.pass)
        .then((userData) =>
        {
          //AsyncStorage.setItem('userData', JSON.stringify(userData));
          AsyncStorage.multiSet([
            ["email", this.state.email],
            ["password", this.state.pass]
          ])
          this.setState({
                  loading: false,
                });
          this.props.nav.push({
            name: 'userData',
             gestures: null
          });
        }
      ).catch((error) =>
          {
                this.setState({
                  loading: false
                });
          alert('Register Failed. Please try again'+error);
      });
      }
    } else {
      this.requestLocationPermission();
    }
  };

  render() {
    let content = this.state.loading ?
      <View style={styles.loading}>
        <ActivityIndicator size="large"/>
      </View> :
        this.state.content ? this.state.content :
      <View style={styles.container}>
          <Text style={{color: '#fff'}}>Email:</Text>
          <TextInput
            style={styles.form}
            onChangeText={(email) => this.setState({email})}
            value={this.state.email} />
          <Text style={{color: '#fff'}}>Hasło:</Text>
          <TextInput
            style={styles.form}
            onChangeText={(pass) => this.setState({pass})}
            value={this.state.pass}
            secureTextEntry={true}
          />
          <View style={styles.buttons}>
            <Button
              iconLeft
              onPress={this.onLogin}
              marginHorizontal={10}
              style={{backgroundColor: '#21294C'}}
            >
              <Icon name='key' />
              <Text>Logowanie</Text>
            </Button>
            <Button
              iconLeft
              onPress={() => {this.setModalVisible(true)}}
              marginHorizontal={10}
              style={{backgroundColor: '#21294C'}}
              >
              <Icon name='person-add' />
              <Text>Rejestracja</Text>
            </Button>
        </View>
      </View>;

      return (
        <Container>
                            <Header androidStatusBarColor="#141829" style={{ backgroundColor: '#141829'}} >
                                <Body>
                                    <Title>Logowanie</Title>
                                </Body>
                           </Header>
                      <View style={styles.content}>
                      {content}
                      </View>
          <Modal animationType={"slide"}
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={() => {alert("Modal has been closed."); this.setModalVisible(false)}}>
            <View style={styles.container}>
              <Text style={{color: '#fff'}}>Email:</Text>
              <TextInput
                style={styles.form}
                onChangeText={(email) => this.setState({email})}
                value={this.state.email} />
              <Text style={{color: '#fff'}}>Hasło:</Text>
              <TextInput
                style={styles.form}
                onChangeText={(pass) => this.setState({pass})}
                value={this.state.pass}
                secureTextEntry={true}/>
              
              <Button
              iconLeft
              onPress={this.onRegister}
              marginHorizontal={10}
              style={{backgroundColor: '#21294C'}}
              >
              <Icon name='person-add' />
              <Text>Rejestracja</Text>
            </Button>

            </View>


          </Modal>

        </Container>);
  }
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141829',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141829',
  },
  container: {
    width: 300,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: '#141829',
  },
  form: {
    width: 300,
    height: 40,
    marginBottom: 20,
    color: '#fff',
    borderColor: '#fff',
    backgroundColor: '#21294C'
  },
  buttons: {
    width: 300,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
