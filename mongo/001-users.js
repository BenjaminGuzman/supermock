print("Adding users...");
db = db.getSiblingDB("cart");
db.createUser({
	user: "cart_admin",
	pwd: "super password 123",
	roles: [
		{role: "dbOwner", db: "cart"}
	]
});
print("User cart_admin added");
