import {Injectable} from '@angular/core';
import {Storage} from '@ionic/storage';
import {AngularFirestore, AngularFirestoreCollection} from "angularfire2/firestore";
import {Observable} from "rxjs/Rx";
import {map, take} from "rxjs/operators";
import {UtilsProvider} from "../utils/utils";
import {Platform} from "ionic-angular";

@Injectable()
export class UserProvider {

  user;
  userCollection: AngularFirestoreCollection<any>;
  user$: Observable<any>;

  constructor(private storage: Storage,
              private afs: AngularFirestore,
              public _utilsProv: UtilsProvider,
              private platform: Platform) {
    this.getUser().then(user => this.user = user);
    console.log(this.user);
    // this.loadStorage();
  }

  setIdDocumentAndType(id, type) {
    if (this.platform.is('cordova')) {
      // Smarthphone
      this.storage.set('idDocument', id);
      this.storage.set('typeUser', type);
    } else {
      // Desktop
      localStorage.setItem('idDocument', id);
      localStorage.setItem('typeUser', type);
    }
  }

  setUserInStorage(user) {
    if (this.platform.is('cordova')) {
      // Smarthphone
      console.log(user);
      this.storage.set('user', JSON.stringify(user));
    } else {
      // Desktop
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  // loadStorage() {
  //   return new Promise((resolve, reject) => {
  //     if (this.platform.is('cordova')) {
  //       // Smartphone
  //       this.storage.get('user').then(val => {
  //         if (val) {
  //           this.user = JSON.parse(val);
  //           this.userCollection = this.afs.collection(this.user.tipoUsuario, ref => {
  //             return ref.where('key', '==', this.user.key)
  //           });
  //
  //           //Obtener id del documento
  //           this.user$ = this.userCollection.snapshotChanges().pipe(
  //             map(actions => {
  //               return actions.map(a => {
  //                 const data = a.payload.doc.data();
  //                 data.id = a.payload.doc.id;
  //                 data.age = this._utilsProv.getAgeOnlyYear(data.fecha_nacimiento);
  //                 console.log(data);
  //                 return data;
  //               });
  //             }),
  //           );
  //           resolve(true);
  //         } else {
  //           resolve(false);
  //         }
  //       });
  //     } else {
  //       // Desktop
  //       if (localStorage.getItem('user')) {
  //         this.user = JSON.parse(localStorage.getItem('user'));
  //         this.userCollection = this.afs.collection(this.user.tipoUsuario, ref => {
  //           return ref.where('key', '==', this.user.key)
  //         });
  //
  //         //Obtener id del documento
  //         this.user$ = this.userCollection.snapshotChanges().pipe(
  //           map(actions => {
  //             return actions.map(a => {
  //               const data = a.payload.doc.data();
  //               data.id = a.payload.doc.id;
  //               data.age = this._utilsProv.getAgeOnlyYear(data.fecha_nacimiento);
  //               console.log(data);
  //               return data;
  //             });
  //           }),
  //         );
  //         resolve(true);
  //       } else {
  //         resolve(false);
  //       }
  //     }
  //   });
  // }

  getUser$(user) {
    this.userCollection = this.afs.collection('usuarios', ref => {
      return ref.where('key', '==', user.key)
    });

    return this.userCollection.snapshotChanges()
      .pipe(
        map(actions => {
          return actions.map(a => {
            const data = a.payload.doc.data();
            data.id = a.payload.doc.id;
            data.age = this._utilsProv.getAgeOnlyYear(data.fecha_nacimiento);
            console.log(data);
            return data;
          });
        }),
        take(1)
      );
  }

  async getUser() {
    let user = '';
    if (this.platform.is('cordova')) {
      user = await this.storage.get('user')
    } else {
      if (localStorage.getItem('user')) {
        user = localStorage.getItem('user')
      }
    }
    return JSON.parse(user)
  }

  isUserInStorage() {
    const promise = new Promise((resolve, reject) => {
      if (this.platform.is('cordova')) {
        this.storage.get('user').then(val => {
          val ? resolve(true) : resolve(false)
        });
      } else {
        localStorage.getItem('user') ? resolve(true) : resolve(false)
      }
    });
    return promise;
  }

  initUserFirestore() {
    console.log(this.user);
    this.userCollection = this.afs.collection(this.user.tipoUsuario, ref => {
      return ref.where('key', '==', this.user.key)
    });
  }

  deleteUser() {
    this.user = null;
    if (this.platform.is('cordova')) {
      this.storage.remove('user');
      this.storage.remove('idDocument');
      this.storage.remove('typeUser');
    } else {
      localStorage.removeItem('user');
    }
  }

  getTypeUser() {
    const promise = new Promise((resolve, reject) => {
      this.storage.get('typeUser').then(
        val => resolve(val)
      );
    });
    return promise;
  }

  async getIdDocument() {
    let idDocument;
    if (this.platform.is('cordova')) {
      idDocument = await this.storage.get('idDocument')
    } else {
      idDocument = localStorage.getItem('idDocument')
    }
    return idDocument;
  }

  createUser(user) {
    console.log(user);
    return this.afs.collection('usuarios').add(user);
  }
}
