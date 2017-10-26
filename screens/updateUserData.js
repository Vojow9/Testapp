import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  View,
  TextInput,
  ActivityIndicator,
  AsyncStorage,
  Input,
  Picker,
} from 'react-native';

import { Header,Container,Title, Form, Item, Label, Content, List, ListItem, Left, Right, Body, InputGroup, Icon, Text, Button } from 'native-base';

export default class UpdateUserData extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nav: this.props.nav,
      nr: '',
      color: '',
      model: '',
    };

    this.onUpdate = this.onUpdate.bind(this);
  }

  componentDidMount(){
    const userId = this.props.fb.auth().currentUser.uid;
    this.props.fb.database().ref('/users/' + userId).once('value').then(function(data){
      this.setState({
        nr: data.val().nr,
        color : data.val().color,
        model : data.val().model,
      })
    }.bind(this)
  )
  }


  onUpdate() {
    if(this.state.color || this.state.nr || this.state.model) {
      const userId = this.props.fb.auth().currentUser.uid;
      this.props.fb.database().ref('users/' + userId).set({
        nr: this.state.nr,
        color: this.state.color,
        model : this.state.model,
      }).then(() => {
        this.props.nav.replace({
                name: 'main',
              });
      });
    }
  }

  render() {
    return (
    <Container>
                  <Header androidStatusBarColor="#141829" style={{ backgroundColor: '#141829'}} >
                    <Body>
                        <Title>Dane samochodu</Title>
                    </Body>
                  </Header>
    <View style={styles.content}>
    <View style={styles.container}>
          <Text style={{color: '#fff'}}>Nr rejestracyjny:</Text>
          <TextInput maxLength={8}
            style={styles.form}
            onChangeText={(nr) => this.setState({nr})}
            value={this.state.nr} />
          <Text style={{color: '#fff'}}>Marka:</Text>
          <TextInput
            style={styles.form}
            onChangeText={(model) => this.setState({model})}
            value={this.state.model}
          />
          <Text style={{color: '#fff'}}>Kolor:</Text>
            <Picker 
            selectedValue={this.state.color}
            onValueChange={(value) => this.setState({color: value})}
            style={styles.form}>
              <Picker.Item label="Czerwony" value="#ff0000"/>
              <Picker.Item label="Zielony" value="#00ff00"/>
              <Picker.Item label="Niebieski" value="#0000ff"/>
              <Picker.Item label="Czarny" value="#ffffff"/>
              <Picker.Item label="Biały" value="#000000"/>
              <Picker.Item label="Różowy" value="#ffc0cb"/>
              <Picker.Item label="Szary" value="#808080"/>
              <Picker.Item label="Żółty" value="#ffff00"/>

            </Picker>
          <Button iconLeft onPress={this.onUpdate} style={{backgroundColor: '#21294C'}} >
              <Icon name='checkmark' />
              <Text>Zapisz</Text>
            </Button>
    </View>
    </View>
    </Container>);
  }
};

const styles = StyleSheet.create({
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
