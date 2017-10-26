import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  View,
  TextInput,
  ActivityIndicator,
  AsyncStorage,
  Input,
  List,
  Text,
  Image,
  TouchableWithoutFeedback,
  ListView,
  ToastAndroid,
  Modal,
  PermissionsAndroid,
  TouchableHighlight,
  Platform,
} from 'react-native';

import { Header,Container,Title, Form, Item, Label, Content, Body, ListItem, Left, Right, InputGroup, Icon, Picker, Button, CheckBox } from 'native-base';

import FCM, {FCMEvent, RemoteNotificationResult, WillPresentNotificationResult, NotificationType} from 'react-native-fcm';

import {
  AudioPlayer,
  AudioRecorder,
  AudioUtils,
} from 'react-native-audio-player-recorder';

import RNFetchBlob from 'react-native-fetch-blob'

const alerts = {
  LIGHTS: 'Awiaria oświetlenia',
  OIL: 'Wyciek płynów',
  TIRE: 'Awaria układu jezdnego',
  EXHAUST: 'Awaria układu wydechowego',
  ACCIDENT: 'Wypadek',
};

const maxTime = 20;

const Blob = RNFetchBlob.polyfill.Blob
const fs = RNFetchBlob.fs
window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest
window.Blob = Blob

export default class Main extends Component {
  constructor(props) {
    super(props);

    this.onBtnPress = this.onBtnPress.bind(this);
    this.onNewRecord = this.onNewRecord.bind(this);
    this._onPressItem = this._onPressItem.bind(this);
    this.renderRow = this.renderRow.bind(this);
    this.renderItems = this.renderItems.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.stopRecord = this.stopRecord.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.playVoice = this.playVoice.bind(this);
        this.requestLocationPermission = this.requestLocationPermission.bind(this);

    this.closePlayer = this.closePlayer.bind(this);

    let dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2,
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2
    });

    this.state = {
      users: null,
      usersArray: null,
      token: null,
      id: null,
      coords: {
        lon: 0,
        lat: 0,
      },
      dataSource: dataSource.cloneWithRowsAndSections([]),
      modalVisible: false,
      timer: 0,
      playerProgress: 0,
      timerFunc: null,
      isRecording: false,
      isPlaying: false,
      filename: null,
      playerVisible: false,
      voicePlaying: false,
      voiceUrl: null,
    };
  }

  componentDidMount() {
    const userId = this.props.fb.auth().currentUser.uid;
    this.setState({id: userId });

    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then(() => {
      this.setState({getpermission: true});
      console.log('ma');
    }, () => {
      console.log('nie ma');
      this.requestLocationPermission();
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log(position);

        this.props.fb.database().ref('users/' + userId + '/coords').set({
          lon: position.coords.longitude,
          lat: position.coords.latitude,
      }).then(() => {
        this.setState({coords: {
          lon: position.coords.longitude,
          lat: position.coords.latitude,
        }});
      });
      },
      (error) => console.log(error.message),
      {enableHighAccuracy: false, timeout: 20000, maximumAge: 1000}
    );

    navigator.geolocation.watchPosition(
      (position) => {
        this.props.fb.database().ref('users/' + userId + '/coords').set({
          lon: position.coords.longitude,
          lat: position.coords.latitude,
      }).then(() => {
        this.setState({coords: {
          lon: position.coords.longitude,
          lat: position.coords.latitude,
        }});
      });
      },
      (error) => console.log(error.message),
      {enableHighAccuracy: false, timeout: 20000, maximumAge: 1000}
    );

    const usersRef = this.props.fb.database().ref(`/users/${userId}/nearby`);
        usersRef.on('value', function(element) {
          let tempUsers = element.val()
          let usersArray = [];
          _.forEach(element.val(), (val, key) => {
            tempUsers[key].checked = false;
            tempUsers[key].id = key;
            usersArray.push(tempUsers[key]);
          });
          this.setState({users: tempUsers});
          this.renderItems(usersArray);
        }.bind(this));

        // usersRef.once('value').then(function(snapshot) {
        //   console.log(snapshot.val());
        //   this.setState({users: snapshot.val()});
        // }.bind(this));

        FCM.requestPermissions(); // for iOS
        FCM.getFCMToken().then(token => {
            console.log('FCM token:', token);
            this.props.fb.database().ref().child('/users/' + userId).update({ token });
            this.setState({token});
        });

        this.refreshTokenListener = FCM.on(FCMEvent.RefreshToken, (token) => {
            console.log('New FCM token:', token);
            this.props.fb.database().ref().child('/users/' + userId).update({ token });
            this.setState({token});
        });

         this.notificationListener = FCM.on(FCMEvent.Notification, async (notif) => {
            // there are two parts of notif. notif.notification contains the notification payload, notif.data contains data payload
            if(notif.local_notification){
              //this is a local notification
              console.log('local_notification');
            }
            if(notif.opened_from_tray){
              //app is open/resumed because user clicked banner
              console.log('opened_from_tray', notif, notif.msgId);
              if(notif.msgId) {
                let self = this;
                this.props.fb.database().ref(`/voices/${notif.msgId}`).once('value').then(function(snapshot) {
                  let url = snapshot.val().url;
                  self.setState({voiceUrl: url, playerVisible: true});
                });
              }
            }
            if(notif.fcm && notif.fcm.body) {
              if(notif.fcm.tag) {
                /* Create local notification for showing in a foreground */
                FCM.presentLocalNotification({
                   body: notif.fcm.body,
                   priority: "high",
                   title: notif.fcm.title,
                   sound: "default",
                   "large_icon": "ic_launcher",// Android only
                   icon: "ic_launcher",
                   color: "#141829",
                   "show_in_foreground" :true, /* notification when app is in foreground (local & remote)*/
                   vibrate: 300, /* Android only default: 300, no vibration if you pass null*/
                   "lights": true, // Android only, LED blinking (default false)
                   status: notif.status,
                   msgId: notif.fcm.tag,
                   click_action: "play_sound",
               });
              } else {
                /* Create local notification for showing in a foreground */
                FCM.presentLocalNotification({
                   body: notif.fcm.body,
                   priority: "high",
                   title: notif.fcm.title,
                   sound: "default",
                   "large_icon": "ic_launcher",// Android only
                   icon: "ic_launcher",
                   color: "#141829",
                   "show_in_foreground" :true, /* notification when app is in foreground (local & remote)*/
                   vibrate: 300, /* Android only default: 300, no vibration if you pass null*/
                   "lights": true, // Android only, LED blinking (default false)
                   status: notif.status
               });
              }
                console.log('dupa', notif, notif.fcm);
            }
        });

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

  componentWillUnmount() {
    this.notificationListener.remove();
    this.refreshTokenListener.remove();
    navigator.geolocation.stopObserving();
  }

  onBtnPress(msg) {
    let to = [];
    let hasChecked = false;
    let usersArray = this.state.usersArray;

    for(u in usersArray) {
      if(usersArray[u].checked || msg == alerts.ACCIDENT) {
        hasChecked = true;
      }
    }

    for(x in usersArray) {
      if(msg == alerts.ACCIDENT && !hasChecked) {
        if(usersArray[x].token && usersArray[x].token != this.state.token) {
          to.push(usersArray[x].token);
        }
      } else {
        if(usersArray[x].token && usersArray[x].token != this.state.token && usersArray[x].checked) {
          to.push(usersArray[x].token);
        }
      }
    }

    if(to.length > 0) {
      this.props.fb.database().ref(`messages/${new Date().getTime()}`).set({
        from: this.props.fb.auth().currentUser.uid,
        msg: msg,
        to : to,
      });
      ToastAndroid.show(`Wysłano komunikat: ${msg}`, ToastAndroid.SHORT);
    } else {
      ToastAndroid.show('Zaznacz osoby aby wysłać komunikat', ToastAndroid.SHORT);
    }

    for(let x = 0; x < usersArray.length; x++) {
        usersArray[x] = {
          id: usersArray[x].id,
          name: usersArray[x].name,
          color: usersArray[x].color,
          model: usersArray[x].model,
          token: usersArray[x].token,
          nr: usersArray[x].nr,
          checked: false,
          coords: usersArray[x].coords || null,
        };
    }

    this.renderItems(usersArray);
  }

  onNewRecord() {
    let hasChecked = false;
    let usersArray = this.state.usersArray;

    for(x in usersArray) {
      if(usersArray[x].token && usersArray[x].token != this.state.token && usersArray[x].checked) {
        hasChecked = true;
      }
    }

    if(hasChecked) {
      this.setModalVisible(true);

      let timerFunc = setInterval(() => {
        if(this.state.timer < maxTime) {
          this.setState({timer: this.state.timer + 1});
        } else {
          this.stopRecord();
        }
      }, 1000);

      let filename = `temp${Date.now()}.aac`;

      this.setState({timerFunc: timerFunc, isRecording: true, filename: filename});

      AudioRecorder.prepareRecordingAtPath(`${AudioUtils.DocumentDirectoryPath}/${filename}`, {
        SampleRate: 22050,
        Channels: 1,
        AudioQuality: 'High',
        AudioEncoding: 'aac',
        AudioEncodingBitRate: 32000
      });
      AudioRecorder.startRecording();
    } else {
      ToastAndroid.show(`Należy zaznaczyć co najmniej jedną osobę.`, ToastAndroid.SHORT);
    }
  }

  stopRecord() {
    this.setState({
      timerFunc: clearInterval(this.state.timerFunc),
      isRecording: false,
    });
    AudioRecorder.stopRecording();
  }

  closeModal(sendFile) {
    const self = this;
    this.setModalVisible(false);
    if(this.state.isRecording) {
      this.stopRecord();
    }
    this.setState({timer: 0});

    if(sendFile) {
      console.log(this.state.filename);

      let to = [];
      let usersArray = this.state.usersArray;

      for(x in usersArray) {
        // TODO: && usersArray[x].token != this.state.token
        if(usersArray[x].token  && usersArray[x].checked) {
          to.push(usersArray[x].token);
        }
      }

      this.uploadFile(`${AudioUtils.DocumentDirectoryPath}/${this.state.filename}`, this.state.filename).then(function(url) {
        console.log(url)
        self.props.fb.database().ref(`voices/${new Date().getTime()}`).set({
          from: self.props.fb.auth().currentUser.uid,
          url: url,
          to : to,
          filename: self.state.filename,
        });
        ToastAndroid.show(`Wysłano wiadomość głosową.`, ToastAndroid.SHORT);

      }, function(err) {
        console.log('dupa', err)
        ToastAndroid.show(`Nie można wysłać wiadomości głosowej.`, ToastAndroid.SHORT);
      });
    }

    usersArray = this.state.usersArray;
    for(x in usersArray) {
      usersArray[x] = {
          id: usersArray[x].id,
          name: usersArray[x].name,
          color: usersArray[x].color,
          model: usersArray[x].model,
          token: usersArray[x].token,
          nr: usersArray[x].nr,
          checked: false,
          coords: usersArray[x].coords || null,
        };
    }

    this.renderItems(usersArray);
  }

  uploadFile(uri, fileName) {
        return new Promise((resolve, reject) => {
            const uploadUri = uri;
            let uploadBlob = null
            const fileRef = this.props.fb.storage().ref('voice').child(fileName)
            fs.readFile(uploadUri, 'base64')
            .then((data) => {
              return Blob.build(data, { type: `audio/aac;BASE64` })
            })
            .then((blob) => {
              uploadBlob = blob
              return fileRef.put(blob, { contentType: 'audio/aac' })
            })
            .then(() => {
              uploadBlob.close()
              return fileRef.getDownloadURL()
            })
            .then((url) => {
              resolve(url)
            })
            .catch((error) => {
              reject(error)
            })
        });
      }

  _onPressItem(item) {
    let tempUsers = this.state.usersArray;
    for(let x = 0; x < tempUsers.length; x++) {
      if(tempUsers[x].id == item.id) {
        tempUsers[x] = {
          id: tempUsers[x].id,
          name: tempUsers[x].name,
          color: tempUsers[x].color,
          model: tempUsers[x].model,
          token: tempUsers[x].token,
          nr: tempUsers[x].nr,
          checked: !tempUsers[x].checked,
          coords: tempUsers[x].coords || null,
        };
      }
    }

    this.renderItems(tempUsers);
  }

  renderRow(item) {

    return (<TouchableWithoutFeedback onPress={() => this._onPressItem(item)}>
                    <View style={{flexDirection: 'row'}}>
                    <View width={90}>
                      <Text style={styles.listItem}>{item.nr}</Text>
                    </View>
                    <View style={styles.colors} backgroundColor={item.color}></View><Text style={styles.listItem}> {item.model}</Text>
                    <Right>
                    <View style={styles.checkmark} >{ item.checked ? <Icon style={{color: '#fff'}} name="md-checkbox-outline" /> : <Icon style={{color: '#fff'}} name="md-square-outline" />  }</View>
                    </Right>
                    </View>
                  </TouchableWithoutFeedback>);
  }

  renderItems(items) {
    let newArray = items.slice();
    this.setState({
      usersArray: items,
      dataSource: this.state.dataSource.cloneWithRows(newArray),
    });
  }

  setModalVisible(visible) {
    this.setState({modalVisible: visible});
  }

  playVoice() {
    this.setState({voicePlaying: true});
    let self = this;
    AudioPlayer.playWithUrl(this.state.voiceUrl);
    AudioPlayer.setFinishedSubscription();
    AudioPlayer.setProgressSubscription();
    AudioPlayer.onFinished = (data) => {
      console.log('dupa koniec', data);
      self.setState({voicePlaying: false, playerProgress: 0});
    };
    AudioPlayer.onProgress = (data) => {
      console.log('dupa', data);
      self.setState({playerProgress: data.currentTime});
    };
  }

  closePlayer() {
    if(this.state.voicePlaying) {
      AudioPlayer.stop();
      this.setState({voicePlaying: false,playerVisible: false, voiceUrl: null, playerProgress: 0});
    }
    //this.setState({playerVisible: false});
  }

  render() {
  let { token } = this.state;
    return (
    <Container>
                  <Header androidStatusBarColor="#141829" style={{ backgroundColor: '#141829'}} >
                      <Left>
                          <TouchableHighlight>
                            <Icon name="menu" onPress={() => this.props.menu.openDrawer()} style={{color: 'white'}}/>
                          </TouchableHighlight>
                      </Left>
                      <Right>
                           <Title>CarCare</Title>
                      </Right>
                  </Header>
    <View style={styles.container}>
          <View style={styles.half}>
            <Content>
              <ListView
                style={styles.list}
                dataSource={this.state.dataSource}
                renderRow={this.renderRow}
                enableEmptySections={true}
              />
            </Content>
          </View>
          <View style={styles.half}>
          <View style={styles.buttons}>
            <Button rounded large onPress={() => this.onBtnPress(alerts.LIGHTS)}
                style={{backgroundColor: '#21294C', width: 100, height: 100}}>
              <Image source={require('../img/light.png')} style={{width: 48, height: 48}} />
            </Button>
            <Button rounded large onPress={() => this.onBtnPress(alerts.OIL)} style={{backgroundColor: '#21294C', width: 100, height: 100}}>
              <Image source={require('../img/oil.png')} style={{width: 48, height: 48}} />
            </Button>
            <Button rounded large onPress={() => this.onBtnPress(alerts.TIRE)} style={{backgroundColor: '#21294C', width: 100, height: 100}}>
              <Image source={require('../img/tire.png')} style={{width: 48, height: 48}} />
            </Button>
          </View>
          <View style={styles.buttons}>
            <Button rounded large onPress={() => this.onBtnPress(alerts.EXHAUST)} style={{backgroundColor: '#21294C', width: 100, height: 100}}>
              <Image source={require('../img/exhaust.png')} style={{width: 48, height: 48}} />
            </Button>
            <Button rounded large onPress={() => this.onBtnPress(alerts.ACCIDENT)} style={{backgroundColor: '#21294C', width: 100, height: 100}}>
              <Image source={require('../img/accident.png')} style={{width: 48, height: 48}} />
            </Button>
            <Button rounded danger large onPress={() => this.onNewRecord()} style={{backgroundColor: '#830505', width: 100, height: 100}}>
              <Image source={require('../img/record.png')} style={{width: 48, height: 48}} />
            </Button>
          </View>
          </View>
    </View>
    <Modal
          animationType={'slide'}
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={() => {return false;}}
          >
         <View style={styles.container}>
          <View style={styles.timerConatiner}>
            <Text style={styles.timer}>{`00:${('0' + this.state.timer).slice(-2)}`}</Text>

            <Button block success large onPress={() => this.closeModal(true)} style={{margin: 10}}>
              <Text style={{color: '#fff'}}>Wyślij</Text>
            </Button>
            <Button block danger large onPress={() => this.closeModal(true)}  style={{margin: 10}}>
              <Text style={{color: '#fff'}}>Anuluj</Text>
            </Button>

          </View>
         </View>
        </Modal>
        <Modal
          animationType={'slide'}
          transparent={false}
          visible={this.state.playerVisible}
          onRequestClose={() => {return false;}}
          >
         <View style={styles.container}>
          <View style={styles.timerConatiner}>
            <Text style={styles.timer}>{`00:${('0' + Math.floor(this.state.playerProgress))}`}</Text>

            <Button block success large onPress={() => this.playVoice()} style={{margin: 10}}>
              <Text style={{color: '#fff'}}>Odtwarzaj</Text>
            </Button>
            <Button block danger large onPress={() => this.closePlayer()}  style={{margin: 10}}>
              <Text style={{color: '#fff'}}>Zamknij</Text>
            </Button>

          </View>
         </View>
        </Modal>
    </Container>);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141829',
  },
  half: {
    flex: 1,
  },
  list: {
    flex: 1,
    backgroundColor: '#797C85',
    margin: 5,
  },
  buttons: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  listItem: {
    color: '#fff',
    fontSize: 18,
    padding: 2,
  },
  colors: {
    width: 16,
    height: 16,
    marginTop: 6,
    marginRight: 4,
    backgroundColor: '#f00',
  },
  checkmark: {
    marginRight: 5,
  },
  timerConatiner: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: {
    marginTop: 20,
    color: '#fff',
    fontSize: 70,
  }
});
