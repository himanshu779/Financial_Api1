
const userModel = require('../model/model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const moment = require('moment-timezone');
const InvestmentLedger = require('../model/investmentLedger');
const investment = require('../model/investments');
const exceljs = require('exceljs');


module.exports.home = async (req,res) =>{

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
    
        const data = await userModel.find()
          .skip((page - 1) * limit)
          .limit(limit);
          
          const total = await userModel.countDocuments();
          const totalPages = Math.ceil(total / limit);

          if (data.length > 0) {
              return res.json({
                  msg: "done",
                  data: req.user,
                  status: 200,
                  total,
                  totalPages,
                  currentPage: page
                });
        } else {
          return res.json({ msg: "data not exist", status: 400 });
        }
      } catch (error) {
        console.error(error);
    }
}

module.exports.login = async (req,res) => {

    try {
        let checkUser = await userModel.findOne({email:req.body.email});
        if(checkUser)
        {
            if(checkUser.password === req.body.password)
            {
                let token = jwt.sign({'userData':checkUser},'testkey',{expiresIn:86400});
                return res.json({msg:'login successfully',status:200,token:token});
            }
            else
            {
                return res.json({msg:'your password is not correct',status:400});
            }
        }
        else
        {
            return res.json({msg:'user not found', status:400});
        }

    } catch (error) {
        console.error(error);
    }

}

var transporter  = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "914d16b4b793bf",
      pass: "98eae3ad2dcc73"
    }
  });

module.exports.forgotPassword = async (req,res) =>{
    try {
        const email = req.body.email;
        const user = await userModel.findOne({email:email});
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = crypto.randomBytes(3).toString('hex');
        user.otp = otp;
        user.otpExpires = Date.now() + 3600000;
        await user.save();

        const mailOptions = {
            from: 'admin@example.com',
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is ${otp}`,
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: 'OTP sent to your email',otp:otp });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}

module.exports.resetPassword = async (req,res) =>{
try {
    const { email, otp, newPassword } = req.body;
    const user = await userModel.findOne({ email, otp, otpExpires: { $gt: Date.now() } });
    if (!user) {
        return res.status(400).json({ message: 'Invalid OTP or OTP expired' });
    }
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    return res.status(200).json({ message: 'Password reset successfully',data:{email,newPassword}});
    
} catch (error) {
    return res.status(500).json({ message: 'Server error', error });
}

}

module.exports.createUser = async (req,res)=>{

    try {
        let alreadyexists = await userModel.findOne({email:req.body.email});
        if(alreadyexists) return res.json({msg:'user already exists',status:400});

        let user = await userModel.create(req.body);
        if(user) return res.json({msg:'user added successfully', status:200, data:user});
        else return res.json({msg:'something wrong', status:400});
        
    } catch (error) {
        console.error(error);
    }

}

module.exports.deleteUser = async (req,res)=>{
    try {
        
        let userId = await userModel.findById(req.params.id);

        if(userId)
        {
            let userDelete = await userModel.findByIdAndDelete(userId);
            if(userDelete)
            {
               return res.json({msg:'Record Deleted',data:userDelete});
            }
            else
            {
                res.json({msg:'Record Not Deleted', status:400});
            }
        }
        else
        {
           return res.json({msg:'Record not found',status:400});
        }

    } catch (error) {
        console.error(error)
    }
}

module.exports.updateUser = async (req,res) =>{
    try {
        
        let userId = await userModel.findById(req.params.id);
        if(userId)
        {
            let userUpdate = await userModel.findByIdAndUpdate(userId,req.body);
            if(userUpdate)
            {
                res.json({msg:'Record Updated', data:userUpdate});
            }
            else
            {
                res.json({msg:'Record Not Updated', status:400});
            }
        }
        else
        {
            res.json({msg:'Record not found', status:400});
        }

    } catch (error) {
        console.error(error);
    }
}

module.exports.addInvestment = async (req, res) =>{
    try {
        const userId = req.user._id;
        const startDate = moment.tz(req.body.startDate, 'Asia/Kolkata').toDate();
        const expiryDate = moment(startDate).add(req.body.holdingPeriod, 'days').toDate();
        // expiryDate.setDate(expiryDate.getDate() + req.body.holdingPeriod);
        const returnAmount = req.body.amount + (req.body.amount * (req.body.roi / 100));
    
        const newInvestment = {
            amount: req.body.amount,
            roi: req.body.roi,
            holdingPeriod: req.body.holdingPeriod,
            startDate: new Date(req.body.startDate),
            expiryDate: expiryDate,
            status: expiryDate > new Date(),
            returnAmount: returnAmount,
            userId: userId,
        };
        const newLedgerEntry = {
            userId,
            amount: req.body.amount,
            roi: req.body.roi,
            holdingPeriod: req.body.holdingPeriod,
            debit: req.body.amount,
            credit:returnAmount,
            expiryDate: expiryDate,
            startDate: new Date(req.body.startDate),
            status: expiryDate > new Date(),
        };
        const addInvestment = await InvestmentLedger.create(newLedgerEntry);
        if(!req.body.amount) return res.json({msg:'Amount is required', status:400});
        if(!req.body.roi) return res.json({msg:'Roi is required', status:400});
        if(!req.body.holdingPeriod) return res.json({msg:'holdingPeriod is required', status:400});
        req.user.investments = req.user.investments || [];
        req.user.investments.push(newInvestment);
        await req.user.save();
        if(addInvestment) return res.json({msg:'Investment added successfully', status:200, data:req.user.investments});

    } catch (error) {
        console.error(error);
    }
}

module.exports.getInvestment = async (req, res) =>{
    try {
        const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const today = new Date();
    const investments = user.investments.map(investment => {
      const status = today < investment.expiryDate;
      const remainingDays = status ? Math.ceil((investment.expiryDate - today) / (1000 * 60 * 60 * 24)) : 0;

      return {
        _id: investment._id,
        amount: investment.amount,
        roi: investment.roi,
        holdingPeriod: investment.holdingPeriod,
        startDate: investment.startDate,
        expiryDate: investment.expiryDate,
        status: status,
        returnAmount: investment.returnAmount,
        remainingDays: status ? remainingDays : null
      };
    });
    res.json({
        username: user.name,
        email: user.email,
        investments: investments
      });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
      }
}

module.exports.getAllInvestmentLedger = async (req, res) => {
    try {

        // Call the update-status API
        const fetch = (await import('node-fetch')).default;
        const updateResponse = await fetch('http://localhost:8000/update-investment-ledger', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization // Pass the authorization header if needed
            }
        });
        if (!updateResponse.ok) {
            return res.status(updateResponse.status).json({ msg: 'Failed to update investments', status: updateResponse.status });
        }
        const userId = req.user._id;
        const allInvestments = await InvestmentLedger.find({ userId });

        if (allInvestments.length === 0) {
            return res.json({ msg: 'No investments found', status: 400 });
        }

        const todayDate = moment().format('DD-MM-YYYY');
        const user = await userModel.findOne({ _id: userId });

        if (!user.investments || user.investments.length === 0) {
            return res.status(400).json({ msg: 'No investments found for user', status: 400 });
        }

        const startDate = moment(allInvestments[0].startDate).format('DD-MM-YYYY');
        const endDate = moment(allInvestments[0].expiryDate).format('DD-MM-YYYY');
        const status = todayDate < endDate;

        // allInvestments.forEach(investment => {
        //     if (status) {
        //         investment.debit = investment.returnAmount;
        //         investment.credit = 0;
        //     } else {
        //         investment.credit = investment.returnAmount;
        //         investment.debit = 0;
        //         investment.bs = investment.returnAmount; // Set B/S to the same as credit when status is false
        //     }
        // });

        // Create a new workbook and worksheet
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Feb\'18');

        // Add title with date range
        worksheet.mergeCells('A1:G1');
        worksheet.getCell('A1').value = `BANK STATEMENT (CONSOLIDATED) INR (${startDate} - ${endDate})`;
        worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

        // Add headers
        worksheet.addRow(['Particulars', 'Credit', 'Debit', 'ROI (%)', 'Cycle (in Days)', 'B/S']);

        // Add data
        allInvestments.forEach(investment => {
            worksheet.addRow([
                'Investment Details', // Replace with actual particulars if available
                investment.credit,
                investment.debit,
                investment.roi, // ROI (%)
                investment.holdingPeriod, // Cycle (in Days)
                investment.bs || investment.amount // B/S
            ]);
        });

        // Set column widths
        worksheet.columns = [
            { header: 'Particulars', key: 'particulars', width: 30 },
            { header: 'Credit', key: 'credit', width: 15 },
            { header: 'Debit', key: 'debit', width: 15 },
            { header: 'ROI (%)', key: 'roi', width: 15 },
            { header: 'Cycle (in Days)', key: 'cycle', width: 15 },
            { header: 'B/S', key: 'bs', width: 30 }
        ];

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=InvestmentLedger.xlsx');

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

        return res.json({ status: 200, data: allInvestments }); 
    }
    catch (error) {
        console.error(error);
        // return res.status(500).json({ msg: 'Internal server error', status: 500 });
        if (!res.headersSent) {
            res.status(500).json({ msg: 'Internal server error', status: 500 });
        }
    }
};

module.exports.updateInvestmentLedger =  async (req, res) => {
    try {
        const userId = req.user._id;
        const todayDate = moment().format('YYYY-MM-DD');
        const allInvestments = await InvestmentLedger.find({ userId });

        if (allInvestments.length === 0) {
            return res.status(400).json({ msg: 'No investments found', status: 400 });
        }

        const bulkOps = allInvestments.map(investment => {
            const expiryDate = moment(investment.expiryDate).format('YYYY-MM-DD');
            const status = todayDate < expiryDate;
            const returnAmount = investment.amount + (investment.amount * (investment.roi / 100));

            const updateFields = {
                status: status,
                credit: status ? 0 : returnAmount,
                debit: status ? investment.amount : 0
            };

            return {
                updateOne: {
                    filter: { _id: investment._id },
                    update: { $set: updateFields }
                }
            };
        });

        await InvestmentLedger.bulkWrite(bulkOps);

        res.json({ msg: 'Status and amounts updated successfully', status: 200 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Internal server error', status: 500 });
    }
}

