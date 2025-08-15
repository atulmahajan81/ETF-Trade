import logging
from tradingapi_a.mconnect import *

logging.basicConfig(level=logging.DEBUG)

#Object for MConnect API
mconnect_obj=MConnect()

#Login
login_response=mconnect_obj.login("<user_id>","<password>")

#Generate access token by calling generate session
gen_response=mconnect_obj.generate_session("<API_Key>","<request_token_here>","<checksum>")

#Place Order
try:
    porder_resp=mconnect_obj.place_order(_tradingsymbol="SBICARD",_exchange="NSE",_transaction_type="BUY",_order_type="MARKET",_quantity="10",_product="CNC",_validity="DAY",_price="0",_trigger_price="0")
    
    logging.info("Order placed. ID is: {}".format(porder_resp["data"]["order_id"]))

except Exception as e:
    logging.info("Order placement failed: {}".format(e.message))

#Fetch all orders
mconnect_obj.get_order_book()

#Fetch all holdings
mconnect_obj.get_holdings()

#Get Net position for logged in user
mconnect_obj.get_net_position()

#Cancel All orders
mconnect_obj.cancel_all()

#Get fund Summary
mconnect_obj.get_fund_summary()
