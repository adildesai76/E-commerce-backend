import Wallet from "../models/Wallet.js";


export const getWallet = async(req,res)=>{

 try{

  let wallet = await Wallet.findOne({
    userId:req.user.id
  });


  if(!wallet){
    wallet = await Wallet.create({
      userId:req.user.id,
    });
  }


  res.json({
    success:true,
    wallet,
  });


 }catch(error){

  res.status(500).json({
    success:false,
    message:error.message,
  });

 }

};
