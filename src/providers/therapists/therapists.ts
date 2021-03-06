import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument} from "angularfire2/firestore";
import {Platform, ToastController} from "ionic-angular";
import {Storage} from "@ionic/storage";
import {map} from "rxjs/operators";
import {UtilsProvider} from "../utils/utils";
import * as firebase from 'firebase';
import {Subscription} from "rxjs/Rx";

@Injectable()
export class TherapistsProvider {
  therapistCollection: AngularFirestoreCollection<any>;
  requestConsultationCollection: AngularFirestoreCollection<any>;
  relationshipCollection: AngularFirestoreCollection<any>;
  relationshipDoc: AngularFirestoreDocument<any>;

  idDocument;
  typeUser;
  user;

  constructor(public _utilsProv: UtilsProvider,
              private afS: AngularFirestore,
              private storage: Storage,
              private platform: Platform,
              private toast: ToastController) {
    console.log('Hello TherapistsProvider Provider');
  }

  getTherapists() {
    this.therapistCollection = this.afS.collection('usuarios', ref => {
      return ref.where('tipoUsuario', '==', 'terapeutas')
    });
    return this.therapistCollection.snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data();
          data.id = a.payload.doc.id;
          data.edad = this._utilsProv.getAgeOnlyYear(data.fecha_nacimiento);
          return data;
        });
      }),
    );
  }

  sentRequest(user) {
    this.loadStorage();
    let id = user.id;
    let dataSent = {};
    dataSent[id] = {
      tipo_solicitud: 'enviado'
    };
    let dataReceive = {};
    dataReceive[this.idDocument] = {
      tipo_solicitud: 'recibido'
    };
    console.log(`${this.idDocument}_${id}`);
    this.relationshipDoc = this.afS.collection('relaciones').doc(`${this.idDocument}_${id}`);
    const subscription: Subscription = this.relationshipDoc.valueChanges().subscribe(
      res => {
        if (!res) {
          console.log('Ya hay datos: ', res);
          this.requestConsultationCollection = this.afS.collection('solicitudes');
          this.requestConsultationCollection.doc(`${this.idDocument}_${id}`).set(
            {
              id_terapista: id,
              id_usuario: this.idDocument,
              status: 'recibida',
              informacion_usuario: JSON.parse(this.user)
            }
          ).then(
            () => {
              this.presentToast('Solicitud enviada con exito')
              subscription.unsubscribe();
            }
          )
            .catch(
              () => {
                this.presentToast('Error al enviar solicitud')
                this.presentToast('Solicitud enviada con exito')
                subscription.unsubscribe();
              }
            )
        } else {
          this.presentToast('Esta persona y tú ya son amigos');
          subscription.unsubscribe();
          console.log('No hay datos', res);
        }
      },
      error1 => console.error(error1),
      () => console.log('Completado')
    );
  }

  getPatientsRequest(idDocument) {
    this.requestConsultationCollection = this.afS.collection('solicitudes', ref => {
      return ref
        .where('id_terapista', '==', idDocument)
        .where('status', '==', 'recibida')
    });

    return this.requestConsultationCollection.valueChanges().pipe(
      map(
        (res: Array<any>) => {
          console.log(res);
          res.forEach(
            (x) => {
              x.informacion_usuario.edad = this._utilsProv.getAgeOnlyYear(x.informacion_usuario.fecha_nacimiento);
            }
          );
          return res;
        }
      )
    );
  }

  confirmRequest(patient, idDocument) {
    const idPatient = patient.id_usuario;
    console.log(patient);
    this.loadStorage();
    this.relationshipCollection = this.afS.collection('relaciones');
    this.requestConsultationCollection = this.afS.collection('solicitudes');
    console.log(`${idPatient}_${this.idDocument}`);
    this.requestConsultationCollection.doc(`${idPatient}_${idDocument}`).delete()
      .then(
        () => {
          this.relationshipCollection.doc(`${idPatient}_${idDocument}`).set(
            {
              id_paciente: idPatient,
              id_terapista: idDocument,
              status: 'aceptado',
              fecha_aceptado: firebase.firestore.FieldValue.serverTimestamp(),
              paciente_info: patient.informacion_usuario,
              terapista_info: JSON.parse(this.user)
            }
          ).then(
            () => this.presentToast('Paciente agregado, ahora puedes hablar con el')
          )
            .catch(
              () => this.presentToast('Error al agregar paciente, intentalo más tarde')
            )

        }
      )
  }

  presentToast(message) {
    const toast = this.toast.create(
      {
        message: message,
        position: 'bottom',
        duration: 2000
      }
    );
    toast.present();
  }

  loadStorage() {
    return new Promise((resolve, reject) => {
      if (this.platform.is('cordova')) {
        this.storage.get('idDocument').then(val => {
          if (val) {
            this.idDocument = val;
          }
        });
        this.storage.get('user')
          .then(
            val => {
              if (val) {
                this.user = val;
              }
            }
          );
        this.storage.get('typeUser').then(val => {
          if (val) {
            this.typeUser = val;
          }
        });
        return resolve();
      } else {
        this.idDocument = localStorage.getItem('idDocument');
        this.typeUser = localStorage.getItem('typeUser');
        this.user = localStorage.getItem('user');
        return resolve();
      }
    });

  }

}
