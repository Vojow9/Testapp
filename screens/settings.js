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
} from 'react-native';

import { Header,Container,Title, Form, Item, Label, Content, List, ListItem, Left, Right, Body, InputGroup, Icon, Text, Picker, Button } from 'native-base';

export default class Menu extends Component{
  constructor(props){
    super(props);
  }

  onBtnPress(msg) {
    alert(msg);
  }

  render(){

    return(
      <Container>
      <Header>
          <Body>
          <Left>
            <Title>CarCare</Title>
          </Left>
          <Right>
            <Icon name="menu"/>
          </Right>

          </Body>
      </Header>
      <Button rounded large onPress={() => this.onBtnPress('Ustawienia')}>
        title="Ustawienia"
      </Button>
      <Button rounded large onPress={() => this.onBtnPress('Komunikaty')}>
        title="Komunikaty"
      </Button>
      <Button rounded large onPress={() => this.onBtnPress('Infomracje o aplikacji')}>
        title="Infomracje o aplikacji"
      </Button>

      </Container>
    );

  }



}
