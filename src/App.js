import React, { Component } from 'react';
import './App.css';
import firebase from 'firebase';
import csv from 'fast-csv';
const config = {
	apiKey: 'AIzaSyAe_vrYYYatU1AvSmymS2paTQir4ZUnZW4',
	authDomain: 'infoski-dev.firebaseapp.com',
	databaseURL: 'https://infoski-dev.firebaseio.com',
	projectId: 'infoski-dev',
	storageBucket: 'infoski-dev.appspot.com',
	messagingSenderId: '347393580307'
};
const fileReader = new FileReader();

const init = e => {
	if (!firebase.apps.length) {
		console.log('init');
		firebase.initializeApp(config);
	}

	firebase
		.auth()
		.signInWithEmailAndPassword(
			'horatiu.vezentan@freshbyteinc.com',
			'P@ssw0rd'
		)
		.catch(function(err) {
			console.log(err.message);
		});
};

class App extends Component {
	constructor() {
		super();
		this.handleFile = this.handleFile.bind(this);
		this.handleRead = this.handleRead.bind(this);
	}
	handleRead = e => {
		const content = fileReader.result;
		const services = [];
		csv.fromString(content, { headers: true })
			.on('data', data => {
				const service = {};
				if (data.Resort) service.resortID = data.Resort;
				if (data.Category) service.categoryID = data.Category;
				if (data.Photo) service.photo = data.Photo;
				if (data.Name) service.name = data.Name;
				if (data.Description) service.description = data.Description;

				const address = {};
				let addAddress = false;
				if (data.Address_street) {
					address.street = data.Address_street;
					addAddress = true;
				}

				if (data.Address_locality) {
					address.locality = data.Address_locality;
					addAddress = true;
				}

				if (addAddress) {
					service.address = address;
				}

				const location = {};
				if (data.Lat) {
					location.latitude = data.Lat;
				}

				if (data.Long) {
					location.longitude = data.Long;
				}
				service.location = JSON.stringify(location);

				const schedule = {};
				if (data.Open) {
					schedule.open = data.Open;
				}

				if (data.Close) {
					schedule.close = data.Close;
				}
				service.schedule = JSON.stringify(schedule);

				if (data.Phone) service.phone = data.Phone;
				if (data.Email) service.email = data.Email;

				const book = {};
				let addBook = false;
				if (data.Book_text) {
					book.text = data.Book_text;
					addBook = true;
				}

				if (data.Book_url) {
					book.url = data.Book_url;
					addBook = true;
				}

				if (addBook) service.book = book;
				if (data.Active) {
					service.active = data.Active === 'true' ? true : false;
				}
				services.push(service);
			})
			.on('end', function() {
				console.log('done');
				init();
				firebase.auth().onAuthStateChanged(user => {
					if (user) {
						const categoriess = [];
						services.forEach(service => {
							const ref = firebase
								.database()
								.ref('Resorts')
								.child(service.resortID)
								.child('services');

							ref.once('value').then(snapshot => {
								snapshot.forEach(category => {
									const id = category.val();
									const index = categoriess.indexOf(id);
									if (index === -1) {
										categoriess.push(category.val());
									}
								});

								const index = categoriess.indexOf(
									service.categoryID
								);
								if (index === -1) {
									categoriess.push(service.categoryID);
								}
								const resortRef = firebase
									.database()
									.ref('Resorts')
									.child(service.resortID)
									.child('services');
								resortRef.set(categoriess);
								const serviceRef = firebase
									.database()
									.ref('Services')
									.push(service);
								serviceRef.once('value').then(snapshot => {
									console.log(snapshot.val());
								});
							});
						});
					} else {
						console.log('unauthorized');
					}
				});
			});
	};

	render() {
		return (
			<div className="App">
				<input
					type="file"
					id="file"
					className="input-file"
					accept=".csv"
					onChange={e => this.handleFile(e.target.files[0])}
				/>
			</div>
		);
	}

	handleFile = file => {
		fileReader.onloadend = this.handleRead;
		fileReader.readAsText(file);
	};
}
export default App;
