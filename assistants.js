const xlsx = require('node-xlsx');
const admin = require('firebase-admin');

const serviceAccount = require('./keys.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://jalatechzone.firebaseio.com'
});

if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    'use strict';
    if (typeof start !== 'number') {
      start = 0;
    }

    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

const db = admin.firestore();
const collection = db.collection('assistants');
const workSheetsFromBuffer = xlsx.parse('data/jala-assistants.xlsx');
const data = workSheetsFromBuffer[0].data.map(currentData => {
  const package = getPackage(currentData[7]);
  return {
    fullName: currentData[1] ? currentData[1].toString().trim() : '',
    email: currentData[4]
      ? currentData[4]
          .toString()
          .replace(/\s/g, '')
          .toLowerCase()
      : '',
    phone: currentData[5] ? currentData[5].toString().trim() : '',
    package: package,
    deleteFlag: false,
    insertDate: new Date(),
    checkIn: false,
    snackOne: false,
    snackTwo: false,
    lunch: false
  };
});
data.shift();

data.forEach(assistant => {
  if (assistant.email) {
    collection
      .where('email', '==', assistant.email)
      .get()
      .then(matchData => {
        if (matchData.empty) {
          addAssistant(assistant);
        }
      });
  } else {
    addAssistant(assistant);
  }
});

function addAssistant(assistant) {
  collection.add(assistant).then(ref => {
    const data = {
      id: ref.id,
      ...assistant
    };
    collection.doc(ref.id).set(data);
  });
}

function getPackage(package) {
  if (package) {
    package = package.toLowerCase();
    if (package.includes('fami')) {
      return 'jalaFamily';
    } else if (package.includes('teens')) {
      return 'teens';
    } else if (package.includes('gold')) {
      return 'gold';
    } else if (package.includes('plat')) {
      return 'platinum';
    }
  }
  return '';
}
