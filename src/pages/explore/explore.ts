import {Component, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {App, IonicPage, ModalController, NavController, NavParams} from 'ionic-angular';
import {UserProvider} from "../../providers/user/user";

import {MenuPage} from "../menu/menu";
import {Direction, StackConfig, SwingCardComponent, SwingStackComponent} from "angular2-swing";
import {MatchedPage} from "../matched/matched";

import {MessagingPage} from "../messaging/messaging";
import {Subscription} from "rxjs/Rx";
import {TherapistsProvider} from "../../providers/therapists/therapists";
import {ProfilePage} from "../profile/profile";
import * as _ from 'lodash';


@IonicPage()
@Component({
  selector: 'page-explore',
  templateUrl: 'explore.html',
})
export class ExplorePage {
  @ViewChild('cardStack') swingStack: SwingStackComponent;
  @ViewChildren('card') swingCards: QueryList<SwingCardComponent>;

  data$: Subscription;

  cards: any[];
  stackConfig: StackConfig;
  users: any[];
  isLoading: boolean = true;
  noUsers: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams,
              public userProv: UserProvider,
              public _therapistProv: TherapistsProvider,
              public modalCtrl: ModalController,
              public app: App) {
    this.stackConfig = {
      // Default setting only allows UP, LEFT and RIGHT so you can override this as below
      allowedDirections: [
        Direction.LEFT,
        Direction.RIGHT
      ],
      throwOutConfidence: (offsetX, offsetY, element) => {
        return Math.min(Math.abs(offsetX) / (element.offsetWidth/2), 1);
      },
      transform: (element, x, y, r) => {
        this.onItemMove(element, x, y, r);
      },
      throwOutDistance: (d) => {
        return 800;
      }
    };

    console.log(this.userProv.user);
  }

  ngAfterViewInit() {
    this.cards = [];
  }

  ionViewDidLoad() {
    this.data$ = this._therapistProv.getTherapists()
      .subscribe(
        res => {
          console.log(res);
          if( res.length > 2) {
            this.users = res;
            if(this.cards.length === 0) {
              this.addNewCard();
              this.addNewCard();
            }
            this.isLoading = false;
          } else if(res.length === 0) {
            this.isLoading = false;
            this.noUsers = true;
          }
        }
      );
    console.log('ionViewDidLoad ExplorePage');
  }

  ionViewCanLeave() {
    console.log('Estoy en CanLeave Trackingcharts');
    this.data$.unsubscribe();
  }

  // Called whenever we drag an element
  onItemMove(element, x, y, r) {
    let nope = element.querySelector('.stamp-nope');
    let like = element.querySelector('.stamp-like');
    let caculatedValue = Math.min(100, Math.abs(x) - 20) / 100;// 0 - 1

    if (x < 0 && Math.abs(x) > 20) {
      nope.style.opacity = caculatedValue;
    } else {
      like.style.opacity = caculatedValue;
    }

    element.style['transform'] = `translate3d(0, 0, 0) translate(${x}px, ${y}px) rotate(${r}deg)`;

    // Zoom effect for the cards underneath
    let cardBehind = this.swingCards.toArray()[1].getNativeElement();
    cardBehind.style['transform'] = `scale(${0.94 + 0.06 * caculatedValue}, ${0.94 + 0.06 * caculatedValue})`;
  }

  // Add new cards to our array
  addNewCard() {
    let difference = _.difference(this.users, this.cards);
    let randomIndex = Math.floor(Math.random() * (difference.length));

    this.cards.push(difference[randomIndex]);

    console.info('CURRENT STACK:', this.cards.map(c => c.nombre));
  }

  disliked() {
    this.addNewCard();
    let removedCard = this.cards.shift();

    console.log('You disliked: ' + removedCard.name);
  }

  liked() {
    this.addNewCard();
    let removedCard = this.cards.shift();
    this.checkMatching(removedCard);

    console.log('You liked: ' + removedCard.name);
  }

  checkMatching(card) {
    this._therapistProv.sentRequest(card);
    if (card.name == 'Hieu Pham') {
      let modal = this.modalCtrl.create(MatchedPage);
      modal.present();
    }
  }

  getMoreCards() {
    if (this.cards.length == 0) {
      this.addNewCard();
    }
  }

  trackByFn(index, item) {
    return item.id;
  }

  goToMenu() {
    this.app.getRootNav().setRoot(MenuPage)
      .then(() => {
        console.log('Welcome to your ExplorePage!');
      })
  }

  goToMessaging() {
    this.navCtrl.push(MessagingPage, {}, {
      direction: 'forward'
    });
  }

  openProfile(profile) {
    let modal = this.modalCtrl.create(ProfilePage, {profile: profile});
    modal.present();
  }

}
