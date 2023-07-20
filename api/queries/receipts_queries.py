from pydantic import BaseModel
from queries.pool import pool
from queries.rides_queries import RideAccount, RideOut, RideDriver


class ReceiptIn(BaseModel):
    ride_id: int
    account_id: int
    total: float


class ReceiptOut(BaseModel):
    receipt_id: int
    total: float
    ride_id: int
    account_id: int


class ReceiptGet(BaseModel):
    receipt_id: int
    total: float
    ride: RideOut
    account: RideAccount


class GetReceiptRide(BaseModel):
    id: int
    account_id: int
    is_roundtrip: bool
    start_location: str
    end_location: str
    ride_status: str
    datetime: str
    vehicle_info: str
    comments: str | None
    driver: RideDriver | None


class ReceiptGetWithDriver(BaseModel):
    receipt_id: int
    total: float
    ride: GetReceiptRide
    account: RideAccount


class DuplicateReceiptError(ValueError):
    pass


class ReceiptQueries:
    def create(self, receipt: ReceiptIn) -> ReceiptOut:
        try:
            print('receipt: ', receipt)
            with pool.connection() as conn:
                with conn.cursor() as db:
                    print('connected to db')
                    result = db.execute(
                        """
                        INSERT INTO receipts
                        (
                        ride_id,
                        account_id,
                        total
                        )
                        VALUES
                        (%s,%s,%s)
                        RETURNING
                        id,ride_id,account_id,total;
                        """,
                        [receipt.ride_id,
                         receipt.account_id,
                         receipt.total]
                    )
                    returned_value = result.fetchone()
                return self.record_to_receipt(returned_value)
        except Exception as e:
            return {'error': e}

    def refund(self, ride_id):
        try:
            print('ride_id: ', ride_id)
            with pool.connection() as conn:
                with conn.cursor() as db:
                    result = db.execute(
                        """
                        UPDATE receipts
                        SET total = -total
                        WHERE ride_id = %s;
                        """,
                        [ride_id]
                    )
                    print(result)
        except Exception as e:
            return {'error': e}

    def delete(self, ride_id):
        try:
            print('ride_id: ', ride_id)
            with pool.connection() as conn:
                with conn.cursor() as db:
                    result = db.execute(
                        """
                        DELETE FROM receipts
                        WHERE ride_id = %s;
                        """,
                        [ride_id]
                    )
                    print(result)
                    return {'message': 'Deleted'}
        except Exception as e:
            return {'error': e}

    def get_receipts_by_account(self, account_id: int):
        with pool.connection() as conn:
            with conn.cursor() as db:
                result = db.execute(
                    """
                    SELECT re.total, re.id, r.*, a.username, a.first_name,
                      a.last_name, a.email, a.current_ride
                    FROM receipts re
                    INNER JOIN rides AS r
                        ON (r.id = re.ride_id)
                    INNER JOIN accounts AS a
                        ON (a.id = re.account_id)
                    WHERE a.id = %s;
                    """,
                    [account_id],
                )
                returned_values = result.fetchall()
                return [self.get_receipt_record(returned_value)
                        for returned_value in returned_values]

    def get_receipt(self, receipt_id: int):
        with pool.connection() as conn:
            with conn.cursor() as db:
                result = db.execute(
                    """
                    SELECT re.total, re.id, r.*, a.username, a.first_name,
                      a.last_name, a.email, a.current_ride
                    FROM receipts re
                    INNER JOIN rides AS r
                        ON (r.id = re.ride_id)
                    INNER JOIN accounts AS a
                        ON (a.id = re.account_id)
                    WHERE re.id = %s;
                    """,
                    [receipt_id],
                )

                returned_values = result.fetchone()
                return self.get_receipt_record(returned_values)

    def get_receipt_by_ride_id(self, ride_id: int):
        with pool.connection() as conn:
            with conn.cursor() as db:
                result = db.execute(
                    """
                    SELECT re.total, re.id, r.*, a.username, a.first_name,
                      a.last_name,a.email, a.current_ride, d.username,
                      d.first_name, d.last_name, d.email, d.current_ride
                    FROM receipts re
                    INNER JOIN rides AS r
                        ON (r.id = re.ride_id)
                    INNER JOIN accounts AS a
                        ON (a.id = re.account_id)
                    LEFT JOIN accounts AS d ON (r.driver_id = d.id)
                    WHERE r.id = %s;
                    """,
                    [ride_id],
                )

                returned_values = result.fetchone()
                print('receipt: ', returned_values)
                return self.get_receipt_record_with_driver(returned_values)

    def get_all_receipts(self):
        with pool.connection() as conn:
            with conn.cursor() as db:
                result = db.execute(
                    """
                    SELECT re.total, re.id, r.*, a.username, a.first_name,
                      a.last_name, a.email, a.current_ride
                    FROM receipts re
                    INNER JOIN rides AS r
                        ON (r.id = re.ride_id)
                    INNER JOIN accounts AS a
                        ON (a.id = re.account_id);
                    """,
                )

                returned_values = result.fetchall()
                return [self.get_receipt_record(returned_value)
                        for returned_value in returned_values]

    def record_to_receipt(self, record):
        return ReceiptOut(
                        receipt_id=record[0],
                        ride_id=record[1],
                        account_id=record[2],
                        total=record[3],
                )

    def get_receipt_record(self, record):
        return ReceiptGet(
                        receipt_id=record[1],
                        total=record[0],
                        ride=RideOut(
                            id=record[2],
                            account_id=record[3],
                            is_roundtrip=record[4],
                            start_location=record[5],
                            end_location=record[6],
                            ride_status=record[7],
                            datetime=record[8].isoformat(),
                            vehicle_info=record[9],
                            comments=record[10],
                        ),
                        account=RideAccount(
                            username=record[12],
                            first_name=record[13],
                            last_name=record[14],
                            email=record[15],
                            current_ride=record[16],
                        ),
        )

    def get_receipt_record_with_driver(self, record):
        return ReceiptGetWithDriver(
                        receipt_id=record[1],
                        total=record[0],
                        ride=GetReceiptRide(
                            id=record[2],
                            account_id=record[3],
                            is_roundtrip=record[4],
                            start_location=record[5],
                            end_location=record[6],
                            ride_status=record[7],
                            datetime=record[8].isoformat(),
                            vehicle_info=record[9],
                            comments=record[10],
                            driver=RideDriver(
                                username=record[17],
                                first_name=record[18],
                                last_name=record[19],
                                email=record[20],
                                current_ride=record[21],
                            ),
                        ),
                        account=RideAccount(
                            username=record[12],
                            first_name=record[13],
                            last_name=record[14],
                            email=record[15],
                            current_ride=record[16],
                        ),
        )
