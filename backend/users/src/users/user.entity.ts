import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("users")
export class UserEntity {
	@PrimaryColumn("uuid")
	id: string;

	@Column("varchar", { nullable: false, name: "first_name" })
	firstName: string;

	@Column("varchar", { nullable: false, name: "last_name" })
	lastName: string;

	@Column("date", { nullable: false })
	dob: Date;

	@Column("varchar", { unique: true, nullable: false })
	email: string;

	@Column("varchar", { unique: true, nullable: false })
	username: string;

	@Column("smallint", { nullable: false })
	gender: number;

	@Column("varchar", { nullable: false })
	password: string;
}
