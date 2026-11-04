<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $table = 'payments';
    protected $primaryKey = 'payment_id';
    const UPDATED_AT = null;

    protected $fillable = [
        'booking_id',
        'amount',
        'payment_method',
        'status',
        'paid_at'
    ];
}