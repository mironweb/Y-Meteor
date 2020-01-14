import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import * as isSameDay from 'date-fns/is_same_day';
import { MeteorObservable } from "meteor-rxjs";
import { DirectionsRenderer } from '@ngui/map';
import * as _ from "underscore";

@Component({
  selector: 'customers-meetings-map',
  templateUrl: 'customers-meetings-map.page.html',
  styleUrls: ['customers-meetings-map.page.scss']
})

export class CustomersMeetingsMapPage implements OnInit {
  view: string = 'day';
  isDataReady: boolean = true;
  viewDate: Date = new Date();
  excludeDays: number[] = [0, 6];
  startingPlace: string;
  startingMarker: any;
  addPlacesArr: any[] = [];
  locations: any;
  allMarkers: any[];
  markerClusterer: any;

  returnCustomerBranches: boolean = true;
  showNearbySlider: boolean = false;
  hideshowNearbySlider: boolean = false;
  fastestRoute: boolean = false;
  // orderRadioButton: string = 'sequential';
  addDestinations: boolean = false;
  newDestination: string;
  startingLocationSelected: boolean = false;
  positions: any = [];
  mapInstance: any;

  endOfDay: string;
  firstOfDay: string;

  @ViewChild(DirectionsRenderer) directionsRendererDirective: DirectionsRenderer;
  directionsRenderer: google.maps.DirectionsRenderer;
  directionsResult: google.maps.DirectionsResult;
  direction: any = {
    origin: '',
    destination: '',
    // waypoints: [
    //   {location: 'The Alamo', stopover: true},
    // ],
    // optimizeWaypoints: true,
    travelMode: 'DRIVING'
  };
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.directionsRendererDirective['initialized$'].subscribe(directionsRenderer => {
      this.directionsRenderer = directionsRenderer;
    });
    this.allMarkers = []

    var dateSelected = this.viewDate;
    var location = "";
    let geoCodeArr = []

    this.firstOfDay = new Date(this.viewDate.setHours(0,0,0,0)).toISOString()
    this.endOfDay = new Date(this.viewDate.setHours(23,59,59,999)).toISOString()

    this.returnMeetings(Meteor.userId(), this.firstOfDay, this.endOfDay)
  }

  addPlace(place) {

    var geocoder = new google.maps.Geocoder();

    geocoder.geocode({'address': place.formatted_address}, function(results, status) {
          if (status === 'OK') {
            // this.mapInstance.setCenter(results[0].geometry.location);
            let marker = new google.maps.Marker({
              map: this.mapInstance,
              position: results[0].geometry.location
            });
            this.addPlacesArr.push({marker: marker, address: place.formatted_address})
          } else {
            alert('Geocode was not successful for the following reason: ' + status);
          }
        }.bind(this));

    this.newDestination = ""
    this.locations.push({
      name: place.name,
      location: place.formatted_address,
      stopover: true
    })
    this.direction.waypoints.push({
      location: place.formatted_address,
      stopover: true
    })
    this.addDestinations = false;
  }

  showNearby(event) {
    let location = "";
    let geoCodeArr = []
    let bounds = this.mapInstance.getBounds()
    let marker
    let firstDayOfYear = new Date(new Date().getFullYear(), 0, 1, 0, 0, 0)
    let today = new Date()
    let percentage = 0
    let color, direction
    // var markerClusterer

    this.isDataReady = false
    if (!this.showNearbySlider === true) {
      MeteorObservable.call('returnCustomerBranches', bounds).subscribe(customerBranch => {
        if (this.returnCustomerBranches) {
          this.returnCustomerBranches = false

          for (let i = 0; i < Object.keys(customerBranch).length; i++) {
            let address = customerBranch[i]['branches'].address1 + ", "
            + customerBranch[i]['branches'].city + ", "
            + customerBranch[i]['branches'].state + ", "
            + customerBranch[i]['branches'].zipCode

            customerBranch[i]['branches'].latitude =
              new Decimal(customerBranch[i]['branches'].latitude || 0);
            customerBranch[i]['branches'].longitude =
              new Decimal(customerBranch[i]['branches'].longitude || 0);

            geoCodeArr.push({
              customerId: customerBranch[i]._id,
              address: address,
              branchShipto: customerBranch[i]['branches'].shipTo,
              latAndLong: [customerBranch[i]['branches'].latitude, customerBranch[i]['branches'].longitude]
            })
            if (this.showNearbySlider) {
              marker = new google.maps.Marker({
                position: {
                  lat: customerBranch[i]['branches'].latitude,
                  lng: customerBranch[i]['branches'].longitude
                },
                map: this.mapInstance,
              });
              this.allMarkers.push(marker);
              let infowindow = new google.maps.InfoWindow({
                content: ''
              });

              google.maps.event.addListener(marker, 'click', (function (marker, i) {
                let keepButton
                return function () {
                  percentage = 0
                  color = 'black'
                  direction = '◀'
                  MeteorObservable.call('getSalesForCurrentAndPreviousYear', customerBranch[i]).subscribe(sales => {
                    if (sales['currentYearSales'][0] !== undefined && sales['previousYearSales'][0] !== undefined) {
                      let currentYear = sales['currentYearSales'][0]['total']
                      let previousYear = sales['previousYearSales'][0]['total']
                      if (currentYear > previousYear) {
                        //percentageIncrease
                        percentage = ((currentYear - previousYear) / previousYear) * 100
                        color = 'green'
                        direction = '▲'
                      } else if (currentYear < previousYear) {
                        //percentageDecrease
                        percentage = ((previousYear - currentYear) / previousYear) * 100
                        color = 'red'
                        direction = '▼'
                      } else if (currentYear === previousYear) {
                        //noChange
                      }
                    } else {
                    }

                    let infoWindowContent = '<strong>' + customerBranch[i]['branches'].name + `</strong><br>`
                    + address + `<br><div style="font-size: 20px; color: ` + color + `;">` + percentage.toFixed(2)+ `% `+ direction +`</div>`

                    if (!_.contains(_.pluck(this.locations, 'location'), address)) {
                      keepButton = true
                      infowindow.setContent(infoWindowContent + `<button id='marker_${i}'>Add to Route?</button>`);
                    } else {
                      keepButton = false
                      infowindow.setContent(infoWindowContent);
                    }

                    infowindow.open(this.mapInstance, marker);
                    if (keepButton) {
                      google.maps.event.addDomListener(document.getElementById(`marker_${i}`), 'click', (event) => {
                        let address = customerBranch[i].branches.address1 + ', '
                          + customerBranch[i].branches.city + ', '
                          + customerBranch[i].branches.state + ', '
                          + customerBranch[i].branches.zipCode

                        this.locations.push({
                          location: address,
                          name: customerBranch[i].name,
                          lat: customerBranch[i].branches.latitude,
                          long: customerBranch[i].branches.longitude
                        })

                        this.direction.waypoints.push({
                          location: address,
                          stopover: true
                        })
                        infowindow.close()
                        this.route()
                      });
                    }
                  })
                }
              })(marker, i).bind(this));
            }
          }
          // this.markerClusterer = new MarkerClusterer(this.mapInstance, this.allMarkers,
          //   {maxZoom: 12, imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

        }
          this.isDataReady = true
        })
    } else {
      if (this.allMarkers.length > 0) {
        for (var i = 0; i < this.allMarkers.length; i++ ) {
          this.allMarkers[i].setMap(null);
        }
        this.allMarkers = []
        this.allMarkers.length = 0;
        this.markerClusterer.clearMarkers();
        this.returnCustomerBranches = true
      }
      this.isDataReady = true
    }
  }

  onMapReady(map) {
    this.mapInstance = map
  }

  clicked({target: marker}) {
    marker.nguiMapComponent.openInfoWindow('iw', marker);
  }

  zoomEvent(event) {
    this.hideshowNearbySlider = (this.mapInstance.zoom > 5) ? false : true;
  }

  route() {
    this.direction.optimizeWaypoints = (this.fastestRoute) ? true : false
    if (this.startingMarker !== undefined) {
      this.startingMarker.setMap(null);
    }
    if (this.addPlacesArr.length > 0) {
        for (var i = 0; i < this.addPlacesArr.length; i++ ) {
          this.addPlacesArr[i].marker.setMap(null);
        }
        this.addPlacesArr[i] = []
        this.addPlacesArr.length = 0;
    }

    if (this.startingLocationSelected) {
      this.directionsRendererDirective['showDirections'](this.direction)
    }
  }

  removeFromRoute(location) {
    if (location === 'removeAddInput') {
      this.addDestinations = false;
      this.newDestination = "";
    } else {
      for (var i = 0; i < this.addPlacesArr.length; i++) {
        if (this.addPlacesArr[i].address === location) {
          this.addPlacesArr[i].marker.setMap(null);
          this.addPlacesArr.splice(i, 1);
          break;
        }
      }
      for (var i = 0; i < this.direction.waypoints.length; i++) {
        if (this.direction.waypoints[i].location === location) {
          this.direction.waypoints.splice(i, 1);
          break;
        }
      }
      for (var i = 0; i < this.locations.length; i++) {
        if (this.locations[i].location === location) {
          this.locations.splice(i, 1);
          break;
        }
      }
    }
    this.route()
  }

  moveInput(index, direction) {
    var addOrSub1
    switch (direction) {
      case 'up':
        addOrSub1 = -1;
        break;
      case 'down':
        addOrSub1 = 1;
        break;
    }

    var element = this.locations[index];
    this.locations.splice(index, 1);
    this.locations.splice((index + (addOrSub1)), 0, element);

    var wayPointElement = this.direction.waypoints[index];
    this.direction.waypoints.splice(index, 1);
    this.direction.waypoints.splice((index + (addOrSub1)), 0, wayPointElement);

  }

  startLocation(place) {
    this.startingLocationSelected = true
    this.startingPlace = place.name + " - " + place.formatted_address
    this.direction.origin = place.formatted_address
    this.direction.destination = place.formatted_address

    if (this.startingMarker !== undefined) {
      this.startingMarker.setMap(null);
    }

    var geocoder = new google.maps.Geocoder();

    geocoder.geocode({'address': place.formatted_address}, function(results, status) {
          if (status === 'OK') {
            let marker = new google.maps.Marker({
              map: this.mapInstance,
              position: results[0].geometry.location
            });
            this.startingMarker = marker
          } else {
            // alert('Geocode was not successful for the following reason: ' + status);
          }
        }.bind(this));

        this.route()
    // this.directionsRendererDirective['showDirections'](this.direction)
  }

  fastRoute() {
  }

  directionsChanged() {
    this.directionsResult = this.directionsRenderer.getDirections();
    var locationOrder = this.directionsResult.routes[0].waypoint_order
    var displayOrder = []
    var waypointsDisplayOrder = []
    if (locationOrder !== undefined) {
      for (let i = 0; i < locationOrder.length; i++) {
        var j = this.locations.findIndex(obj => obj.location === this.direction.waypoints[locationOrder[i]].location)
        waypointsDisplayOrder.push(this.direction.waypoints[j])
        displayOrder.push(this.locations[j])
      }
    }
    this.direction.waypoints = waypointsDisplayOrder
    this.locations = displayOrder
    this.cdr.detectChanges();
  }

  changeDay() {
    this.firstOfDay = new Date(this.viewDate.setHours(0,0,0,0)).toISOString()
    this.endOfDay = new Date(this.viewDate.setHours(23,59,59,999)).toISOString()

    this.returnMeetings(Meteor.userId(), this.firstOfDay, this.endOfDay)
  }

  returnMeetings(id, firstDay, lastDay) {
    var dateSelected = this.viewDate;
    var location = "";
    this.direction.waypoints = []
    this.locations = []

    let query = [{
        $match: {
          userId: Meteor.userId(),
          dateTime: {
            $gte: new Date(this.firstOfDay),
            $lt: new Date(this.endOfDay)
          }
        }
      },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $unwind: "$customer"
      },
      {
        $addFields: {
          customer: {
            branches: {
              $map: {
                input: "$customer.branches",
                as: "row",
                in: {
                  $mergeObjects: [
                    "$$row",
                    { latitude: { $toDouble: "$$row.latitude" } },
                    { longitude: { $toDouble: "$$row.longitude" } },
                  ],
                },
              },
            },
          },
        },
      }
    ];
    MeteorObservable.call('aggregate', 'customerMeetings', query).subscribe((meetings: Array < any > ) => {
      this.direction.waypoints = [];
      this.locations = [];
      meetings['result'].map(meeting => {
        if (meeting.status === "Pending") {
          if (isSameDay(meeting.dateTime, dateSelected)) {
            if (meeting.customer.branches.length > 0) {
              meeting.customer.branches.map(branch => {
                if (branch.shipTo === meeting.branchShipTo) {
                  location = branch.address1 + ", "
                    + branch.city + ", "
                    + branch.state + ", "
                    + branch.zipCode;

                  branch.latitude = new Decimal(branch.latitude || 0);
                  branch.longitude = new Decimal(branch.longitude || 0);

                  this.locations.push({
                    location: location,
                    name: meeting.customer.name,
                    startTime: meeting.dateTime,
                    lat: branch.latitude.toNumber(),
                    long: branch.longitude.toNumber(),
                  })
                }
              })
            } else {
              location = meeting.customer.address1 + ", "
              + meeting.customer.city + ", "
              + meeting.customer.state + ", "
              + meeting.customer.zipCode

              this.locations.push({
                location: location,
                name: meeting.customer.name,
                startTime: meeting.dateTime
              })
            }
          }
        }
      })
      this.locations.sort(function (a, b) {
        return a.startTime - b.startTime
      });
      this.locations.map(waypoint => {
        this.direction.waypoints.push({
          location: waypoint.location,
          stopover: true,
        })
      })
    })
  }

  addWaypoint() {
    this.addDestinations = true;
  }
}
