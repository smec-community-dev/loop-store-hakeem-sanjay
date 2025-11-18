
module.exports=(req,res,next)=>{
    if(!req.session.adminEmail){
        console.log("there is no session available");
      return res.redirect('/admin/login')
    }next()
}