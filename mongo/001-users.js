use cart
db.createUser({
	user: "cart_admin",
	pwd: "super password 123",
	roles: [
		{role: "dbAdmin", db: "cart"}
	]
});
